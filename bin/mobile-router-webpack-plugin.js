/**
 * @author ff
 * @date 2021/8/7
 * @Description: 手机自动路由webpack插件
 * @update by:
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
function generateRoutes({ pages = 'src/views', importPrefix = '@/views/', common = 'common' }) {
    // 指定文件不需要生成路由配置
    const patterns = ['**/*.vue', `!**/${common}/*.vue`, `!**/${common}/**/*.vue`]
    // 获取所有需要路由配置的文件路径
    const paths = fg.sync(patterns, {
        cwd: pages,
        onlyFiles: true
    })
    const pathArr = paths.map((path) => {
        if (path.indexOf('/index.vue') > -1) {
            return path.substring(0, path.indexOf('/index.vue'))
        } else if (path.indexOf('.vue') > -1) {
            return path.substring(0, path.indexOf('.vue'))
        } else {
            return path
        }
    })
    //  将目录匹配生成路由json
    const routerStr = pathMapToMeta({
        routers: [],
        pathArr: pathArr,
        paths: paths,
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
    {
    path: '/',
    component: Layout,
    children:[\n
    ${code}
    \n]
    }
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
    return `\n{
      path:'${map.path}',
      name:'${map.name}',
      meta:${map.meta},
      index:${map.index},
      component:() => import('${map.component}')
    }`
}

/**
 *
 * @param pathArr 去除.vue目录
 * @param paths 完整目录
 * @param routers 路由
 * @param pages 需要自动生成文件的目录
 * @param importPrefix import 引入页面文件的前缀目录
 * @returns {*[]}
 */
function pathMapToMeta({ routers = [], pathArr, paths, pages, importPrefix }) {
    pathArr.forEach((rows, index) => {
        const rowsArr = rows.split('/') || []
        const row = (rowsArr && rowsArr.length > 0) ? rowsArr[rowsArr.length - 1] : ''
        const item = paths[index] || ''

        // 配置参数
        const router = {
            name: row,
            path: (rows.indexOf('_id') > -1 ? (rows.indexOf('_id') === 0 ? rows.replace('_', ':') : rows.replace('_', '/:')) : rows),
            component: importPrefix + '/' + item,
            meta: `{ title: "${row}" }`
        }
        // 如果value有值，说明可以根据文件路径取meta信息
        const file = fs.readFileSync(pages + '/' + item, 'utf8')
        const metaArr = file.match(/\meta: {[^\{]+\}/g) || file.match(/\meta:{[^\{]+\}/g)
        if (metaArr) {
            const metaStr = metaArr[0]
            // 匹配meta信息
            let meta = ''
            if (metaStr.indexOf('meta') > -1) {
                meta = metaStr.substring(metaStr.indexOf('{'), metaStr.indexOf('}') + 1)
            }
            router.meta = meta
        }
        routers.push(router)
    })
    return routers
}

module.exports = AutoRouter
