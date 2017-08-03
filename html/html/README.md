####安装Npm依赖包

详细的依赖包清单请参考`package.json`文件，Gulp相关配置请看`gulpfile.js`

````
npm install
````

####文件结构

````
newProject/
├── css/
│   ├── less/ [目录]用于生成CSS的目录
│   │   ├── iconfont.less  自定义图标
│   │   ├── ...
│   │   └── allcss.less 所有的less都汇总到这里生成
│   ├── fonts/ [目录]存放字体图标目录
│   ├── img/ [目录]css中使用的相关图片
│   │   ├── ...
│   │   ├── layout 框架布局中用到的相关图片
│   │   └── ui 组件中用到的相关图片
│   ├── ...
│   ├── allcss.css 主要CSS
│   └── allcss.css.map 用于DEBUG，针对开发人员
│
├── font-demo/ [目录]字体图标使用示例，可查看当前引用的自定义图标，正式使用可删除
│
├── js/
│   ├── app/ [目录]网站主要运行的js
│   │   ├── ...
│   │   └── main.js require加载模块参数配置
│   ├── components/ [目录]对一些效果、插件的封装
│   ├── ajax/ [目录]对ajax的封装
│   └── lib/ [目录]各种Javascript库
│
├── images/  [目录]html中使用到的相关图片
│   ├── ...
│   └── webappicon/ [目录]浏览器标题图标、IOS/Android主屏图标
│
├── all-index.html 页面索引汇总，建议先阅读
├── gulpfile.js gulp配置文件，建议先阅读配置
├── package.json 依赖模块json文件,在项目目录下执行 npm install 会安装项目所有的依赖模块
└── *.html x N

````
######文件监听

使用

````
gulp
````
可监听开发目录下`css/**/*.less`,`css/**/*.css`, `js/**/*`, `images/**/*`,`*.html`的变化，自动编译less并刷新浏览器。
