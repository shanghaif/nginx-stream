
var watchPage = new Vue({
      template: "#app-alarmDetail2",
      el: '#alarmDetail2',
      data: {
        params:'',//本地缓存params
        data:[], //缓存李的数据
        dataType:'',
        carinfo:{}, //特定车辆的数据
        carsinfo:[],
        imgDiv:[]
      },
      methods: {
        dataShow:function(){
          this.data = window.localStorage.getItem("carsInfo");
           this.dataType = window.localStorage.getItem("alarmType");
          var arr =  this.data.split("&");
          console.log(arr)
            var _this = this;
            var _url = "queryRptVhcAlarmChart.jsp?"+_this.params;
            var data = {
                 carId:arr[0],
                 stime:arr[1],
                 etime:arr[2],
                 alarmTypes: _this.dataType
            }
            _this.color = webComm.randomColor(arr[3]);
            console.log(data)
            webComm.loadingShow(); //loading动画显示
            webComm.AS.baseRequest(_url,{
                      data: data,
                      callback: function(res) {
                        console.log(res)
                         res = JSON.parse(res);
                         $(".loaderContainer").hide();  //loading动画隐藏
                         _this.carinfo= res;
                         for(var m in _this.carinfo){
                          _this.carsinfo = _this.carinfo[m]
                         }
                        var arr = []
                        for(var i=0; i < _this.carsinfo.length;i++) {                             
                            if (_this.carsinfo[i].picUrl!='') {
                                _this.carsinfo[i].picUrl = webComm.AS.res_url + _this.carsinfo[i].picUrl;
                                arr.push(_this.carsinfo[i].picUrl);
                             };
                             if (_this.carsinfo[i].vidUrl!='') {
                             _this.carsinfo[i].vidUrl = '<video src="'+webComm.AS.res_url +_this.carsinfo[i].vidUrl+'" autoplay="autoplay"></video>';
                             arr.push(_this.carsinfo[i].vidUrl);
                             };        
                             
                         };
                         console.log(_this.carsinfo);
                         console.log(arr);
                         setTimeout(function(){
                                 _this.showImage(arr);
                             },500)
                         
                      },
                      errorback:function(res){
                        $(".loaderContainer").hide();  //loading动画隐藏
                        webComm.alertComponent("网络缓慢");
                      }
                  });
        },
         showImage:function(arr){//点击图片放大
            var myApp = new Framework7();
            var $$ = Dom7;
            var mainView = myApp.addView('.view-main', {
              dynamicNavbar: true
            });
             /*=== Standalone Dark ===*/
            var myPhotoBrowserDark = myApp.photoBrowser({
                photos : arr,
                theme: 'dark',
                backLinkText: '返回'
            });
            $$('.pb-standalone-dark').on('touchstart', function (index) {
                var $index= $(this).attr("data-index");
                myPhotoBrowserDark.open($index);
              
            });
          }
        },
       
      mounted: function() {
        this.params = window.localStorage.getItem("username");
         if (this.params == null) {
            window.localStorage.setItem("goPages",'alarm-detail');
            window.location.href="index.html?1"
        }else{
        // webComm.loadingShow(); //loading动画显示
        this.dataShow();
      }
      }
    });
