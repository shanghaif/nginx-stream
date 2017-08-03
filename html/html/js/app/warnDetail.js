
var watchPage = new Vue({
      template: "#app-warnDetailPage",
      el: '#warnDetailPage',
      data: {
        json:{},
        defaultShow:true,
        warnTypeHide:false //筛选报警类型页面
      },
      methods: {
        showWarnType:function(){ //筛选报警类型页面
        	this.defaultShow=false;
        	this.warnTypeHide = true;
        },
        sureSelected:function(){ //确认报警类型按钮
        	this.warnTypeHide = false;
        	this.defaultShow=true;
        },
        dataShow:function(){ //初次加载数据
          var json1 = {};
          var arr = window.localStorage.getItem("carWarnWatch").split("&&");
          console.log(arr)
          for(var i=0;i<arr.length;i++){
            var arr1 = arr[i].split("&");
            json1[arr1[0]] = arr1[1];
          }
          this.json = json1;
          console.log(json1);
          this.showMap(this.json.lng,this.json.lat);
          var arrImg = [];
          //
          arrImg[0] = json1.picUrl;
          if(json1.vidUrl!=''&&json1.vidUrl!= undefined){
            arrImg[1] = '<video src="'+json1.vidUrl+'" autoplay="autoplay"></video>'
          };
          this.showImage(arrImg);
          console.log(arrImg)
        },
        showMap:function(lng,lat){ //加载地图
          var _this = this;
          var map = new BMap.Map("map-div");          // 创建地图实例
          var point = new BMap.Point(lng,lat);  // 创建点坐标
          map.centerAndZoom(point, 12);                 // 初始化地图，设置中心点坐标和地图级别
          addMarker(point, 0)
          function addMarker(point, index){  // 创建图标对象
              var myIcon = new BMap.Icon("images/carNow.png", new BMap.Size(60, 60), {
                 offset: new BMap.Size(10, 25),
                 imageOffset: new BMap.Size(15, 12)   // 设置图片偏移
               });
              // 创建标注对象并添加到地图
               var marker = new BMap.Marker(point, {icon: myIcon});
               map.addOverlay(marker);    // 将标注添加到地图中
          };
              var opts = {
                position : point,    // 指定文本标注所在的地理位置
                offset   : new BMap.Size(-45, -55)    //设置文本偏移量
              }
              var label = new BMap.Label(_this.json.plate, opts);  // 创建文本标注对象
                  label.setStyle({
                       color : "#30a0e5",
                       fontSize : "12px",
                       height : "20px",
                       lineHeight : "20px",
                       padding: "6px 15px 10px",
                       border: "none",
                       background: "url(images/label-bg.png) no-repeat center ",
                       backgroundSize: "100%"
                   });
              map.addOverlay(label);
        },
        showImage:function(arr){
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
        	$$('.pb-standalone-dark').on('click', function () {
        	    myPhotoBrowserDark.open();
        	});
        }
      },
      mounted: function() {
        this.dataShow();
      }
    });

$(function(){
      //筛选报警类型页面 的报警类型切换
      $(".warnType-ul li").on("click",function(){
   	  		if($(this).hasClass("active")){
   	  			$(this).removeClass("active");
   	  		}else{
   	  			$(this).addClass("active");
   	  		}
   	  	})
})
