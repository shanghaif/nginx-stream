// 载入外挂
var gulp = require('gulp'),
    path = require('path'),
    sass = require('gulp-ruby-sass'),
    less = require('gulp-less'),
    sourcemaps = require('gulp-sourcemaps'),
    autoprefixer = require('gulp-autoprefixer'),
    cleancss = require('gulp-clean-css'),
    uglify = require('gulp-uglify'),
    htmlmin = require('gulp-htmlmin'),
    imagemin = require('gulp-imagemin'),
    rename = require('gulp-rename'),
    clean = require('gulp-clean'),
    concat = require('gulp-concat'),
    notify = require('gulp-notify'),
    cache = require('gulp-cache'),
    browserSync = require('browser-sync'),
    plumber = require('gulp-plumber');
// 样式
gulp.task('styles', function() {
    gulp.src(['css/fonts/**/*'])
        .pipe(gulp.dest('dist/css/fonts'))
        .pipe(notify({
            message: 'Styles task complete'
        }));
    gulp.src(['css/*.css','!css/allcss.css'])
        .pipe(gulp.dest('dist/css'))
        .pipe(notify({
            message: 'Styles task complete'
        }));
    gulp.src(['css/less/allcss.less'])
        .pipe(sourcemaps.init())
        .pipe(plumber({
            errorHandler: function(err) {
                console.log(err);
                this.emit('end');
            }
        }))
        .pipe(less())
        .pipe(autoprefixer({
            browsers: ['> 5% in CN', 'last 10 versions', 'Chrome 24'],
            cascade: true, //是否美化属性值 默认：true 像这样：
            //-webkit-transform: rotate(45deg);
            //        transform: rotate(45deg);
            remove: true //是否去掉不必要的前缀 默认：true
        }))
        .pipe(cleancss())
        .pipe(rename({
        	suffix:'.min'
        }))
        .pipe(sourcemaps.write('./', {
            includeContent: false
        }))
        .pipe(gulp.dest('dist/css'))
        .pipe(notify({
            message: 'Styles task complete'
        }));
});
// 样式-开发模式
gulp.task('styles-dev', function() {
    return gulp.src(['css/less/allcss.less'])
        .pipe(sourcemaps.init())
        .pipe(plumber({
            errorHandler: function(err) {
                console.log(err);
                this.emit('end');
            }
        }))
        .pipe(less())
        .pipe(autoprefixer({
            browsers: ['> 5% in CN', 'last 10 versions', 'Chrome 24'],
            cascade: true, //是否美化属性值 默认：true 像这样：
            //-webkit-transform: rotate(45deg);
            //        transform: rotate(45deg);
            remove: true //是否去掉不必要的前缀 默认：true
        }))
        .pipe(cleancss())
        .pipe(rename({
        	suffix:'.min'
        }))
        .pipe(sourcemaps.write('./', {
            includeContent: false
        }))
        .pipe(gulp.dest('css/'))
        .pipe(notify({
            message: 'Styles task complete'
        }));
});

// 脚本
gulp.task('scripts', function() {
    gulp.src(['./js/ajax/**/*','./js/lib/**/*'], {
            base: './js/'
        })
        .pipe(gulp.dest('dist/js/'))
        .pipe(notify({
            message: 'Scripts task complete'
        }));
    gulp.src(['./js/app/**/*','./js/components/**/*'], {
            base: './js/'
        })
        // .pipe(uglify())  //压缩
        .pipe(gulp.dest('dist/js/'))
        .pipe(notify({
            message: 'Scripts task complete'
        }));
});

// 图片
gulp.task('images', function() {
    gulp.src(['*.ico','./startupImage/**/*'], {
            base: './'
        })
        .pipe(gulp.dest('dist/'));
    gulp.src(['./css/img/**/*','./images/**/*'], {
            base: './'
        })
        .pipe(cache(imagemin({
            optimizationLevel: 5, //类型：Number  默认：3  取值范围：0-7（优化等级）
            progressive: true, //类型：Boolean 默认：false 无损压缩jpg图片
            interlaced: true, //类型：Boolean 默认：false 隔行扫描gif进行渲染
            multipass: true //类型：Boolean 默认：false 多次优化svg直到完全优化
        })))
        .pipe(gulp.dest('dist/'))
        .pipe(notify({
            message: 'Images task complete'
        }));
});

// html
    gulp.task('htmls', function() {
    gulp.src('*.html')//压缩html文件
        .pipe(htmlmin({
            removeComments: true,
            removeEmptyAttributes: true,//删除所有空格作属性值 <input id="" /> ==> <input />
            removeScriptTypeAttributes: true,//删除<script>的type="text/javascript"
            removeStyleLinkTypeAttributes: true,//删除<style>和<link>的type="text/css"
            collapseWhitespace: true, //压缩html:根据情况开启与否
            minifyJS: true,//压缩页面JS
            minifyCSS: true//压缩页面CSS
        }))
        .pipe(gulp.dest('dist/'))
        .pipe(notify({
            message: 'htmls task complete'
        }));
});

// 清理
gulp.task('clean', function() {
    return gulp.src(['dist'], {
            read: false
        })
        .pipe(clean());
});

// 打包压缩
gulp.task('dist', ['clean'], function() {
    gulp.start('htmls', 'styles', 'scripts', 'images');
});
// 预设任务
gulp.task('default', function() {
    // watch所有.less档，一有变动自动编译为css文件
    gulp.watch('css/**/*.less', ['styles-dev']);
    browserSync({
        server: {
            baseDir: './',
            index: "index.html"
        }
    });
    var reload = browserSync.reload;
    // watch所有位在根目录下的档案，一旦有更动，便进行重载
    var watchConfig = ['css/**/*.css', 'js/**/*', 'images/**/*', '*.html'];
    gulp.watch(watchConfig, reload);
});
