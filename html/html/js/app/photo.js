
var watchPage = new Vue({
      template: "#app-photoPage",
      el: '#photoPage',
      data: {
        params:'',
        data:{},
        items:{},
        point:[],
        caritems:{},
        json:[],
        arrData:['111111','222222','3333333','4444444'],
        jsonArr:[],
        jsonCaption:{},
        selectCarNum: 0,
        defaultHide:true,
        filterHide:false, //筛选页面
        filerCarBox:true, //车队列表
        filerCarlists:false//车队中车辆列表
      },
      watch:{
        jsonArr:function(newVal,oldVal){
          var _this = this;
           if(newVal.length>0){
            setTimeout(function(){
             _this.showImage(_this.jsonArr);
              $(".loaderContainer").hide();  //loading动画隐藏
          },1000)
              
           }
        }
      },
      methods: {
        showFilter:function(){ //筛选按钮
        	this.defaultHide=false;
        	this.filterHide = true;
          $(".carNowInfo").hide();
        },
        dataImgShow:function(){//初次渲染数据
          webComm.loadingShow(); //loading动画显示
          var arr = window.localStorage.getItem("carPhotoUrl").split("&");
          var arrAddr = window.localStorage.getItem("carPhotoUrlAddr").split("&&&");         
          var _this = this;
          var arr2 = [];
          for(var i=0;i<arr.length;i++){
          	 var json = {};
          	 if(arr[i].indexOf('video')==-1){
          	 	json.url = arr[i];
          	 }else{
          	 	json.html = arr[i];
          	 }
          	 
          	 json.caption = arrAddr[i];
          	 arr2.push(json);
          }
          _this.jsonArr = arr2;
          for(var i=0;i<arr.length;i++){
          	if(arr[i].indexOf('video')==-1){
          		_this.json.push(arr[i]);
          	}else{
          		_this.json.push('images/player.jpg');
          	}
          }
          
//        _this.json = arr; 
        },
        showImage:function(arr){//点击图片放大
        	var _this = this;
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
          $$('.pb-standalone-dark').on('click', function (index) {
//          var $src = index.path[0].src;
//          var $index = $.inArray($src, arr);
//          if($index==-1){
//              var str = '<video src="'+$src+'" autoplay="autoplay"></video>';
//              $index = $.inArray(str, arr);
//          }
            $index= $(this).attr("data-index");
            myPhotoBrowserDark.open($index);
            
          });
        }
      },
      mounted: function() {
        this.params = window.localStorage.getItem("username");
        if (this.params == null) {
            window.localStorage.setItem("goPages",'photo');
            window.location.href="index.html?1"
        }else{
          this.dataImgShow();
        }
      }
    });

$(function(){

	//右侧覆盖层中的切换
			  $(document).on('touchstart', '.watch-right-top .watch-right-top-top', function(event) { //显示隐藏车队
			     var isHide = $(this).find("b").hasClass("hide");
			     if(isHide){
			         $(this).find("b").removeClass("hide").addClass("show");
			         $(".watch-right-ul").show();
			         $(".watch-right-bottom").show();
			         return false;
			     }else{
			        $(this).find("b").removeClass("show").addClass("hide");
			        $(".watch-right-ul").hide();
			        $(".watch-right-bottom").hide();
			        return false;
			     }
			  })
   //点击document车辆弹窗消失
   $(document).on('touchstart',".carNowInfo",function(){
     console.log("444");
      $(".carNowInfo").hide();
   })
  $(document).on('click',".BMap_mask",function(){
    console.log("444");
     $(".carNowInfo").hide();
  })

})
