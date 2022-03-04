/**
 * @author ff
 * @date 2021/7/19
 * @Description: 自动路由webpack插件
 * @update by:console
 */

const fs = require('fs')
const path = require('path')
const pluginName = 'AutoRouter'
const fg = require('fast-glob') // 读取文件目录
const prettier = require('prettier') // 处理文件格式

// 定义一个自动路由插件类
class AutoRouter {
    constructor(options) {
        // 接收传过来的参数
        this.options = options
    }
    // 插件
    apply(compiler) {
        const generate = () => {
            const code = generateRoutes(this.options)
            let to
            // 处理路由文件生成目录 默认与插件文件并级 如果配置routePath，那生成文件就是此路径下
            if (this.options.routePath) {
                to = path.join(process.cwd(), this.options.routePath)
            } else {
                to = path.join(__dirname, './routes.js')
            }
            // 以同步的方法检测目录是否存在。 如果目录存在 返回true,如果目录不存在 返回false 语法
            // 读取文件信息 如果没有改变直接返回
            if (fs.existsSync(to) &&
                fs.readFileSync(to, 'utf8').trim() === code.trim()) {
                return
            }
            fs.writeFileSync(to, code)
        }
        let watcher = null
        // 设置完初始插件之后，执行插件。
        compiler.hooks.afterPlugins.tap(pluginName, () => {
            generate()
        })
        // 生成资源到 output 目录之前。
        compiler.hooks.emit.tap(pluginName, () => {
            // 监听文件变化的插件
            // paths 一个字符串或者是一个数组，描述监听的文件或者文件夹的路径
            // persistent 与原生fs.watch一样,表示是否保护进程不退出持久监听，默认值为true
            const chokidar = require('chokidar')
            watcher = chokidar.watch(path.join(process.cwd(), this.options.pages || 'src/views/**/*.vue'), {
                persistent: true
            }).on('change', () => {
                generate()
            })
        })
        // 监听模式停止。
        compiler.hooks.watchClose.tap(pluginName, () => {
            if (watcher) {
                watcher.close()
                watcher = null
            }
        })
    }
}

/**
 * 根据目录去生成路由
 * @param pages 解析路由文件目录
 * @param importPrefix import导入前缀目录
 * @param layout 想要生成嵌套路由，目录下需要layout文件，用于配置父节点的meta信息 另个作用是当路由大于二级路由时,_layout需要有<router-view/>，不然页面不会显示
 * @param common 过滤文件路径路径
 * @returns {*}
 */
function generateRoutes({ pages = 'src/views', importPrefix = '@/views/', layout = '_layout.vue', common = 'common' }) {
    // 指定文件不需要生成路由配置
    const patterns = ['**/*.vue', `!**/${layout}`, `!**/${common}/*.vue`, `!**/${common}/**/*.vue`]
    // 获取所有layout的文件路径
    const layoutPaths = fg.sync(`**/${layout}`, {
        cwd: pages,
        onlyFiles: true
    })
    // 获取所有需要路由配置的文件路径
    const paths = fg.sync(patterns, {
        cwd: pages,
        onlyFiles: true
    })
    const pathsArr = paths.map((p) => p.split('/'))
    const layoutPathsArr = layoutPaths.map((p) => p.split('/'))
    // 生成嵌套目录
    const map = {}
    layoutPathsArr.forEach((path) => {
        const dir = path.slice(0, path.length - 1)
        dir.unshift('rootPathLayoutName')
        setToMap(map, pathToMapPath(path.slice(0, path.length - 1)), path)
    })
    pathsArr.forEach((path) => {
        let dir = path
        if (path.indexOf('index.vue') > -1) {
            dir = path.slice(0, path.length - 1)
        }
        setToMap(map, pathToMapPath(dir), path)
    })

    //  将目录匹配生成路由json
    const routerStr = pathMapToMeta({
        children: map.children,
        routers: [],
        pages: pages,
        importPrefix: importPrefix
    })
    // 将json转换文件字符串
    return createRoutes(routerStr)
}

/**
 * 将路由json格式化成字符串
 * @param routers 路由json
 * @returns {*}
 */
function createRoutes(routers) {
    const code = routers.map(createRoute)
    return prettier.format(`import Layout from '@/layout'\nexport default [\n
    ${code}
  \n]`, {
        parser: 'babel',
        semi: false,
        singleQuote: true,
        trailingComma: 'none' // 处理最后一行不加，的问题
    })
}

/**
 * 一级路由转换 第一级的时候需要把component换成Layout 如果没有子节点，则需要将父节点复制一份成为子节点，component指向文件路径
 * @param map
 * @param children
 * @returns {string}
 */
function createRoute(map, children = {}) {
    if (map.children && map.children.length !== 0) {
        children = map.children.map(createRouteZJ)
        if (map.redirect && map.redirect.length > 0) {
            return `\n{
      path:'/${map.path}',
      name:'${map.name}p',
      meta:${map.meta},
      index:${map.index},
      redirect: ${map.redirect},
      alwaysShow: false,
      component: Layout,
      children:[${children}]
    }`
        }
        return `\n{
      path:'/${map.path}',
      name:'${map.name}',
      meta:${map.meta},
      index:${map.index},
      alwaysShow: false,
      component: Layout,
      children:[${children}]
    }`
    } else {
        // 如果只有一级目录，需要单独处理name 不然会报警告name相同
        children = `\n{
      path:'/${map.path}',
      name:'${map.name}',
      meta:${map.meta},
      index:${map.index},
      alwaysShow: false,
      component:() => import('${map.component}')
    }`
        if (map.redirect && map.redirect.length > 0) {
            return `\n{
      path:'/${map.path}',
      name:'${map.name}p',
      meta:${map.meta},
      index:${map.index},
      redirect: ${map.redirect},
      alwaysShow: false,
      component: Layout,
      children:[${children}]
    }`
        }
        return `\n{
      path:'/${map.path}',
      name:'${map.name}p',
      meta:${map.meta},
      index:${map.index},
      alwaysShow: false,
      component: Layout,
      children:[${children}]
    }`
    }
}

/**
 * 二级及以上路由转换
 * @param map json里面的children  子节点里面的path不需要'/'
 * @param children
 * @returns {string}
 */
function createRouteZJ(map, children = {}) {
    if (map.children) {
        children = map.children.map(createRouteZJ)
    }
    if (map.component && map.component.length > 0) {
        return `\n{
    path:'${map.path}',
    name:'${map.name}',
    meta:${map.meta},
    index:${map.index},
    component:() => import('${map.component}'),
    children:[${children}]
    }`
    } else {
        return children
    }
}

/**
 * 将目录生成嵌套树 将每个目录生成key:{value:[],childer:[]}
 * @param map {}
 * @param paths 不带.vue的路径
 * @param value 所有解析处理的层级目录数组
 */
function setToMap(map, paths, value) {
    const target = paths.reduce((item, key) => {
        if (!item.children) {
            item.children = new Map()
        }
        let child = item.children.get(key)
        if (!child) {
            child = {}
            item.children.set(key, child)
        }
        return child
    }, map)
    target.value = value
}

/**
 * 将路径数组 最后一个带有.vue的路径去除
 * @param segments
 * @returns {*}
 */
function pathToMapPath(segments) {
    const last = segments[segments.length - 1]
    return segments.slice(0, -1).concat(basename(last))
}

/**
 * 正则匹配 将.后面的字符串替换为空字符串
 * @param filename
 * @returns {*}
 */
function basename(filename) {
    return filename.replace(/\.[^.]+$/g, '')
}

/**
 *
 * @param children 嵌套目录
 * @param routers 路由
 * @param pages 需要自动生成文件的目录
 * @param importPrefix import 引入页面文件的前缀目录
 * @returns {*[]}
 */
function pathMapToMeta({ children, routers = [], pages, importPrefix }) {
    Array.from(children.keys()).forEach((row) => {
        const item = children.get(row)
        // 配置参数
        const router = {
            name: row,
            path: (row.indexOf('_id') > -1 ? (row.indexOf('_id') === 0 ? row.replace('_', ':') : row.replace('_', '/:')) : row),
            component: '',
            index: 99,
            meta: `{ title: "${row}", icon: "form"}`,
            children: []
        }

        // 如果value有值，说明可以根据文件路径取meta信息
        if (item.value) {
            router.component = importPrefix + '/' + item.value.join('/')
            const file = fs.readFileSync(pages + '/' + item.value.join('/'), 'utf8')
            const metaArr = file.match(/\meta: {[^\{]+\}/g) || file.match(/\meta:{[^\{]+\}/g)
            if (metaArr) {
                const metaStr = metaArr[0]
                // 匹配meta信息
                let meta = ''
                if (metaStr.indexOf('meta') > -1) {
                    meta = metaStr.substring(metaStr.indexOf('{'), metaStr.indexOf('}') + 1)
                }
                router.meta = meta
                // 匹配排序
                if (metaStr.indexOf('sortIndex') > -1) {
                    const sortIndexAll = metaStr.substring(metaStr.indexOf('sortIndex'), metaStr.indexOf('}'))
                    const sortIndex = sortIndexAll.substring(sortIndexAll.indexOf(':') + 1, (sortIndexAll.indexOf(',') > -1 ? sortIndexAll.indexOf(',') : sortIndexAll.length - 1))
                    router.index = Number(sortIndex) * 10
                }
                if (metaStr.indexOf('redirect') > -1) {
                    const redirectALL = metaStr.substring(metaStr.indexOf('redirect'), metaStr.indexOf('}'))
                    router.redirect = redirectALL.substring(redirectALL.indexOf(':') + 1, (redirectALL.indexOf(',') > -1 ? redirectALL.indexOf(',') : redirectALL.length - 1))
                }
            }
        }
        // 如果有children 需要遍历循环匹配
        if (item.children) {
            router.children = pathMapToMeta({
                children: item.children,
                routers: router.children,
                pages: pages,
                importPrefix: importPrefix
            })
        }
        routers.push(router)
    })
    return routers
}

module.exports = AutoRouter
