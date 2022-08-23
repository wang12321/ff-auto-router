import axios from 'axios'
let getToken = ''
let url = ''
const urldev = 'http://10.0.10.213:8200'
const urlProd = 'http://10.0.10.213:8200'
let routerMaps = [] // 路由映射地址
let originalData = [] // 原数据
let menuList = [] // 菜单数据
let controlDataTagList = {} // 控件数据

// 响应拦截器
// response interceptor
axios.interceptors.response.use(
  response => {
    const res = response.data
    return res
  },
  async error => {
    const errorInfo = {
      errno: -1,
      errmsg: ''
    }
    if (!error.response) {
      errorInfo.errmsg = `${error.config.url}响应失败，请刷新浏览器重试。原因${error}`
    } else if (error.response.status === 401) {
      errorInfo.errmsg = `登录信息过期，跳转登录页401`
    } else {
      errorInfo.errmsg = `错误状态码：${error.response.status}`
    }
    return Promise.reject(errorInfo)
  }
)

/**
 *
 * @param token
 * @param platform_key  平台key
 * @param routerUrl   映射地址
 * @param dataType  数据类型: 1-菜单数据，2-控件和数据标签数据 3-all
 * @param env   环境   测试：dev  正式：prod  新环境：prodNew  新环境：prodNew
 * @returns {Promise<{menuList: [], controlDataTagList: {}}|{errno: number, errmsg: string}|{}|[]>}
 */
export function routerData({ token, platform_key, routerUrl, dataType = 1, env = 'dev' }) {
  return new Promise((resolve) => {
    if (token) {
      getToken = token
    } else {
      return {
        errno: 1,
        errmsg: 'token参数错误'
      }
    }
    url = env === 'dev' ? urldev : urlProd
    routerMaps = routerUrl
    getMenuDataAndTag({ platform_key: platform_key }).then((data) => {
      menuList = data.menuData
      controlDataTagList = data.tagData
      console.log(1231, data)
      switch (dataType) {
        case 1:
        case '1':
          resolve(menuList)
          return
        case 2:
        case '2':
          resolve(controlDataTagList)
          return

        default:
          resolve({ menuList, controlDataTagList })
          return
      }
    })
  })
}

const getMenuDataAndTag = (params) => {
  return new Promise((resolve) => {
    axios.defaults.headers.common['x-xq5-jwt'] = getToken
    axios.get(`${url}/v1/web/menu`, { params: params }).then(res => {
      if (res && res.data && Number(res.errno) === 0) {
        originalData = res.data || []
        /**
       * type: 1: 菜单 ，2:控件和数据标签
       *
       */
        const menuData = generateAsyncRouter(originalData, 1)
        const tagData = generateAsyncRouter(originalData, 2)
        resolve({ menuData, tagData })
      }
    })
  })
}

// 映射服务器返回菜单与本地component
function generateAsyncRouter(serverRouterMap, type = 1, children = false) {
  const menuList = []
  switch (type) {
    case 1:
    case '1':
      serverRouterMap.forEach(item => {
        const isParent = item.children && item.children.length > 0

        const parent = generateRouter(item, children ? isParent : true, children)
        if (isParent && (item.children && item.children.filter(item => item.type === 2).length !== 0)) {
          parent.children = generateAsyncRouter(item.children, type, true) || []
        } else if (!children) {
          parent.children = generateRouter(item, isParent, children)
        }
        if ((Number(item.type) === 1 || Number(item.type) === 2) && Number(item.status) === 1) {
          menuList.push(parent)
        }
      })
      return menuList
    case 2:
    case '2':
      return generateControlAndDataTag(serverRouterMap)
    default:
      return []
  }
}

const generateRouter = (item, isParent, children) => ({
  path: !item.is_out_link ? (isParent ? `/${item.route_data}` : item.route_data || '') : item.route_data,
  name: !item.is_out_link ? (isParent ? item.route_data : item.route_data || '') : item.route_data,
  meta: { title: item.name, icon: item.icon, id: item.menu_id, newTime: item.showtime.length >= 10 ? dateAndTimestampConversion(item.showtime) : '', noCache: false },
  component: !item.is_out_link ? (isParent && !children ? routerMaps['Layout'] : routerMaps[item.route_data] || '') : item.route_data
})

/**
 * 时间戳和日期相互转换
 * @param {number|string}  time 时间戳或日期（日期示例:2022-08-10或者2022/08/10 16:37:51）
 * @param {boolean} isDisplayDate  是否仅展示年月日 默认true
 * @returns {string|number}
 * @example
 * dateAndTimestampConversion(1660120671762) // '2022-08-10'
 * dateAndTimestampConversion(1660120671762,false) // '2022-08-10 16:37:51'
 * dateAndTimestampConversion('2022-08-10 16:37:51') // 1660120671000
 * dateAndTimestampConversion('2022/08/10 16:37:51') // 1660120671000
 */
function dateAndTimestampConversion(time, isDisplayDate = true) {
  const timeType = Object.prototype.toString.call(time)
  if (timeType !== '[object Number]' && timeType !== '[object String]') {
    throw new Error('参数应为数字或字符串类型')
  }
  const isTimeTypeIsNum = timeType === '[object Number]'
  if (isTimeTypeIsNum && String(time).length !== 10 && String(time).length !== 13) {
    throw new Error('时间戳位数应为10位数或13位数')
  }
  if (!isTimeTypeIsNum && time.length !== 10 && time.length !== 19) {
    throw new Error('日期位数应为10位数或19位数')
  }
  if (String(time).includes('-') || String(time).includes('/')) {
    const timeTransition = time.replace(/-/g, '/')
    return (new Date(timeTransition).getTime())
  } else {
    const now = new Date(String(time).length === 10 ? (Number(time) * 1000) : Number(time))
    const year = now.getFullYear()
    const month = (now.getMonth() + 1).toString().padStart(2, '0')
    const date = now.getDate().toString().padStart(2, '0')
    const hours = now.getHours().toString().padStart(2, '0')
    const minutes = now.getMinutes().toString().padStart(2, '0')
    const second = now.getSeconds().toString().padStart(2, '0')
    if (isDisplayDate) {
      return `${year}-${month}-${date}`
    } else {
      return `${year}-${month}-${date} ${hours}:${minutes}:${second}`
    }
  }
}

const getSubPlatformData = (params) => {
  axios.defaults.headers.common['x-xq5-jwt'] = getToken
  axios.get(`${url}/v1/web/sub_platform`, { params: params }).then(res => {
    if (res && res.data && Number(res.errno) === 0) {
      console.log(2222, res)
      originalData = res.data || []
      const a = generateAsyncRouter(originalData)
      console.log(111, a)
    }
  })
}
const generateControlAndDataTag = (serverRouterMap, routerUrl = '', controlList = {}) => {
  serverRouterMap.forEach(item => {
    const isParent = item.children && item.children.length > 0
    let parent = {}
    let routerUrlStr = routerUrl
    if ((Number(item.type) !== 1 && Number(item.type) !== 2) && Number(item.status) === 1) {
      parent = dataControlAndDataTag(serverRouterMap)
      controlList[routerUrl] = parent
    } else if ((Number(item.type) === 1 || Number(item.type) === 2) && Number(item.status) === 1) {
      routerUrlStr += !item.is_out_link ? `/${item.route_data}` : item.route_data
      if (isParent) {
        generateControlAndDataTag(item.children, routerUrlStr, controlList)
      }
    }
  })
  return controlList
}

function dataControlAndDataTag(data) {
  const treeList = []
  data.forEach(item => {
    let tmp = {}
    if ((Number(item.type) === 3 || Number(item.type) === 4)) {
      tmp = {
        name: item.name,
        icon: item.icon,
        type: item.type,
        route_data: item.route_data
      }
    } else if ((Number(item.type) === 5 || Number(item.type) === 6)) {
      tmp = {
        name: item.name,
        backend_api: item.backend_api,
        type: item.type,
        data_labels: item.data_labels,
        backend_api_method: item.backend_api_method,
        route_data: item.route_data
      }
    }
    if (item.children) {
      tmp.children = dataControlAndDataTag(item.children)
    }
    treeList.push(tmp)
  })
  return treeList
}

