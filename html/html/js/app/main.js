//配置页面加载模块参数
require.config({
    waitSeconds: 0,
    /*加载等待时间*/
    //添加加载异步加载CSS的插件
    map: {
        '*': {
            'css': '../lib/css.min'
        }
    },
    //配置Javascript文件映射路径
    paths: {
        AS: "../ajax/ajaxServer" /* ajax请求封装 */
    },
    shim: {
        /*模块依赖关系 demo*/
    }
});
// DOM操作库，为了防止和其他库冲突，推荐使用 $$ 来代替 $
//具体使用请移步http://docs.framework7.cn/Index/dom.html
var $$ = Dom7;
require(['AS'], function(AS) {
    webComm.AS = AS;
    // Init F7 Vue Plugin
    Vue.use(Framework7Vue);

    // Init Page Components
    Vue.component('page-about', {
        template: '#page-about'
    })
    Vue.component('page-form', {
        template: '#page-form'
    })
    Vue.component('page-dynamic-routing', {
        template: '#page-dynamic-routing'
    })

    // Init App
    new Vue({
        el: '#app',
        template: '#page-app',
        // Init Framework7 by passing parameters here
        framework7: {
            root: '#app',
            /* Uncomment to enable Material theme: */
            // material: true,
            routes: [{
                    path: '/about/',
                    component: 'page-about'
                },
                {
                    path: '/form/',
                    component: 'page-form'
                },
                {
                    path: '/dynamic-route/blog/:blogId/post/:postId/',
                    component: 'page-dynamic-routing'
                }
            ],
        }
    });
});
require(['common'], function(common) {
   appComm.init();
})
