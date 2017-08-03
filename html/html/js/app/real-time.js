
var watchPage = new Vue({
      template: "#app-watchPage",
      el: '#watchPage',
      data: {
        params:'',
        data:{},
        items:{},
        point:[],
        caritems:{},
        selectCarNum: 0,
        viewPage:true,
        defaultHide:true,
        filterHide:false, //筛选页面
        filerCarBox:true, //车队列表
        filerCarlists:false, //车队中车辆列表
        searchPages:false, //搜索页面
        untreated:false,//未处理报警
        pointed:{
          alarm:'', //状态
          speed:'', //速度
          time:'', //时间
          addr:'', //位置
          plate:'', //车牌号
          carid:'' //车辆id
        },
        teamId: 0,
        carsNum:'',//当前车队下的车辆总数
        carCount:0,//选择的车辆总数量
        carIds:'',//搜索的所有车辆的id
        count: [

        ],
        allCars:[], //搜索页面的数据
        selectArr:[],
        vauleInput:'',
        idValue:'',
        MarkerArr:[] //marker点聚合
      },
      watch:{
        vauleInput:function(newVal,oldVal){
            if(this.vauleInput!=''){
            var str = '';
            for (var i = 0; i < this.allCars.length; i++) {
              var changeIndex= this.allCars[i].plate.indexOf(newVal);

                if (changeIndex!=-1) {
                  this.selectArr.push(this.allCars[i]);
                };
            };
           $(".search-con").html(str);
            }else{
              $('.search-con li').hide();
            }
        }
      },
      methods: {
        showFilter:function(){ //筛选按钮
        	this.defaultHide=false;
        	this.filterHide = true;
          $(".carNowInfo").hide();
          this.fleetList(); //加载车队信息
          this.searchCarList(); //加载搜索的车辆列表
        },
        turnSearch:function(){//搜索跳转搜索页
          this.viewPage = false;
          this.searchPages = true;
        },
        sureSelected:function(){ //车队列表页的确认按钮
          this.carIds = '';
          for(var n=0;n<this.count.length;n++){
            for(var m=0;m<this.count[n].teamId.length;m++){
                this.carIds += ','+this.count[n].teamId[m] ;
            }
          };
          this.carIds = this.carIds.substring(1);
          var _url = "queryRealGis.jsp?"+this.params+'&carIds='+this.carIds;
          var _this = this;
          webComm.AS.baseRequest(_url,{
                           callback: function(res) {
                              res = JSON.parse(res);
                              _this.point = res;
                              _this.mapPoint();
                           },
                           errorback:function(res){
                            //  console.log(res);
                           }
                       });
        	this.filterHide = false;
        	this.defaultHide=true;
        },
        showCarsList:function(index,id){ //查看车队详情
          this.teamId = index;
        	this.filerCarBox = false;
        	this.filerCarlists = true;
          var _url = "queryCars.jsp?"+this.params+"&teamId="+id;
          var _this = this;
          webComm.AS.baseRequest(_url,{
                           data: {},
                           callback: function(res) {
                              // console.log(res);
                              res = JSON.parse(res);
                              _this.caritems = res;
                           },
                           errorback:function(res){
                            //  console.log(res);
                           }
                       });
        },
        fleetList:function(){//车队列表
          var _url = "queryTeams.jsp?"+this.params;
          var _this = this;
          webComm.AS.baseRequest(_url,{
                           data: {},
                           callback: function(res) {
                              res = JSON.parse(res);
                              _this.items = res;

                              for(var i=0;i < res.length;i++) {
                                _this.count.push({num:0,teamItems:[],teamId:[],isAll:0,allCount:res[i].carNum,id:res[i].id});
                              }
                           },
                           errorback:function(res){
                            //  console.log(res);
                           }
                       });
        },
        addItem: function (index,id) {
          if (this.count[this.teamId].teamId.indexOf(id) == -1) {
            this.count[this.teamId].teamItems.push(index);
            this.count[this.teamId].teamId.push(id)
          }else {
            for(var m=0;m<this.count[this.teamId].teamId.length;m++){
               if(this.count[this.teamId].teamId[m]==id){
                  this.count[this.teamId].teamItems.splice(m,1);
                  this.count[this.teamId].teamId.splice(m,1);
                  return false;
               }
            }

          }
        },
        selectedCar:function(){ //车辆列表页的确认按钮

          this.carCount= 0;
          this.count[this.teamId].num =  this.count[this.teamId].teamItems.length;
          for(var m=0;m<this.count.length;m++){
            this.carCount+=parseInt(this.count[m].num);
          }

          this.filerCarlists = false;
          this.filerCarBox = true;
          this.caritems = [];//清空车辆列表的数据
        },
        allCarInfo:function(){
          webComm.loadingShow(); //loading动画显示
          var _url = "queryRealGis.jsp?"+this.params;
          var _this = this;
          webComm.AS.baseRequest(_url,{
                           callback: function(res) {
                              // console.log(res);
                              // $(".loaderContainer").hide();  //loading动画隐藏
                              res = JSON.parse(res);
                              _this.point = res;
                              _this.mapPoint();
                           },
                           errorback:function(res){
                            //  console.log(res);
                           }
                       });
        },
        searchCarList: function(id){//车辆的列表信息
          var _url = "queryCars.jsp?"+this.params;
          var _this = this;
          webComm.AS.baseRequest(_url,{
                           data: {},
                           callback: function(res) {
                              res = JSON.parse(res);
                              _this.allCars=res;
                           },
                           errorback:function(res){

                           }
                       });
        },
        searchResult:function(item){ //搜索结果的点击事件
          this.searchPages = false;
          this.viewPage = true;
          var _this = this;
          var _count = _this.count;
          for(var i=0;i<_this.items.length;i++){
            if(item.teamId==_this.items[i].id){
              for(var n=0;n< _this.count[i].teamId.length;n++){
                 if(item.id== _this.count[i].teamId[n]){
                    return false;
                 }
              }
              if(n>= _this.count[i].teamId.length){
                _this.count[i].teamId.push(item.id);
                _this.count[i].teamItems.push(n);
                _this.count[i].num++;
                this.carCount ++ ;
                return false;
              }
            }
          }

        },
        cancelSearch:function(){ //搜索结果页的取消事件
          this.selectArr = [];
          this.vauleInput = '';
          this.searchPages = false;
          this.viewPage = true;
        },
        mapPoint:function(){//地图
          webComm.loadingShow(); //loading动画显示
          var _this =this;
          var map = new BMap.Map("map-div");          // 创建地图实例
 
          _this.MarkerArr = [];
		          // 地图上多个点
		          for (var i = 0; i < _this.point.length; i++) {
		            var point = new BMap.Point(_this.point[i].blng,_this.point[i].blat);  // 创建点坐标
		
		            // addMarker(point, "images/car-gary-01.png");
		            if(_this.point[i].state==0){//离线-从未上线
		              addMarker(point, "images/car-gray-01.png",_this.point[i].plate);
		            }else if(_this.point[i].state==1){//离线-未定位
		              addMarker(point, "images/car-gray-04.png",_this.point[i].plate);
		            }else if(_this.point[i].state==2){//离线-未定位-报警
		              addMarker(point, "images/car-gray-03.png",_this.point[i].plate);
		            }else if(_this.point[i].state==3){//离线-有定位
		              addMarker(point, "images/car-gray-05.png",_this.point[i].plate);
		            }else if(_this.point[i].state==4){//离线-有定位-报警
		              addMarker(point, "images/car-gray-02.png",_this.point[i].plate);
		            }else if(_this.point[i].state==5){//在线-未定位
		              addMarker(point, "images/car-blue-01.png",_this.point[i].plate);
		            }else if(_this.point[i].state==6){//在线-未定位-报警
		              addMarker(point, "images/car-red-01.png",_this.point[i].plate);
		            }else if(_this.point[i].state==7){//在线-行驶
		              addMarker(point, "images/car-blue-03.png",_this.point[i].plate);
		            }else if(_this.point[i].state==8){//在线-行驶-报警
		              addMarker(point, "images/car-red-02.png",_this.point[i].plate);
		            }else if(_this.point[i].state==9){//在线-停车
		              addMarker(point, "images/car-blue-02.png",_this.point[i].plate);
		            }else if(_this.point[i].state==10){//在线-停车-报警
		              addMarker(point, "images/car-red-03.png",_this.point[i].plate);
		            }
		
		          };
		          if(_this.point.length>0){ //如果返回的数据为空
		            map.centerAndZoom(point, 13);                 // 初始化地图，设置中心点坐标和地图级别
		          }else{
		            webComm.loadingShow(); //loading动画显示
		            var geolocation = new BMap.Geolocation();
		          	geolocation.getCurrentPosition(function(r){
		              var point1 = new BMap.Point(r.point.lng,r.point.lat);  // 创建点坐标
		          	  map.centerAndZoom(point1, 13);                 // 初始化地图，设置中心点坐标和地图级别
		              $(".loaderContainer").hide();  //loading动画隐藏
		              webComm.alertComponent("搜索结果为空");
		          	},{enableHighAccuracy: true})
		          }
         //数组放入聚合方法
		          var markerClusterer = new BMapLib.MarkerClusterer(map, {markers:_this.MarkerArr});
		          var myStyles = [{
		              url:'./images/markerBg.png',  //图标路径
		              size: new BMap.Size(50, 50),  //图标大小
		              textColor: '#fff',  //文字颜色
		              textSize: 16 //字体大小
		            }];
		        markerClusterer.setStyles(myStyles);
		
		
		          var geolocation = map.getBounds().getCenter();
		          geolocation.lng += 0.0000000001;
		          geolocation.lat += 0.000000001;
		          setTimeout(function(){
		            map.panTo(geolocation);
		          },500)
		          setTimeout(function(){
		            $(".loaderContainer").hide();  //loading动画隐藏
		          },2000)
		          map.addEventListener("zoomend",function(){//缩放开始时,触发
		              $(".carNowInfo").hide();
		          });

          function addMarker(point, url , plate){  // 创建图标对象
              var myIcon = new BMap.Icon(url, new BMap.Size(60, 60), {
              // 指定定位位置。
              // 当标注显示在地图上时，其所指向的地理位置距离图标左上
              // 角各偏移10像素和25像素。您可以看到在本例中该位置即是
                 // 图标中央下端的尖角位置。
                 offset: new BMap.Size(10, 25),
                 // 设置图片偏移。
                 // 当您需要从一幅较大的图片中截取某部分作为标注图标时，您
                 // 需要指定大图的偏移位置，此做法与css sprites技术类似。
                 imageOffset: new BMap.Size(15, 12)   // 设置图片偏移
               });
              // 创建标注对象并添加到地图
               var marker = new BMap.Marker(point, {icon: myIcon});
               var opts = {
                position : point,    // 指定文本标注所在的地理位置
                offset   : new BMap.Size(-11, -25)    //设置文本偏移量
              }
              var label = new BMap.Label(plate, opts);  // 创建文本标注对象
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
              // map.addOverlay(label);
              map.addOverlay(marker);    // 将标注添加到地图中
              marker.setLabel(label);
              marker.addEventListener("click",function(){
                // var $plate = this.getLabel().content; //当前的车牌号
                for(var n=0;n<_this.point.length;n++){
                  if(this.point.lat==_this.point[n].blat &&this.point.lng==_this.point[n].blng ){
                       $(".carNowInfo").show();
                       var npoint = _this.point[n];
                       var str =  webComm.stated(npoint.state);
                        _this.pointed = {
                          alarm:str, //状态
                          speed:npoint.speed, //速度
                          time:npoint.time, //时间
                          addr:npoint.addr, //位置
                          plate:npoint.plate, //车牌号
                          carid:npoint.carId //车辆id
                        }
                  }
                }
                return false;
              });
              _this.MarkerArr.push(marker);
          }          
        },
        goTrackDetails:function(plate,carid){
          var val = plate+'&'+carid;
          window.localStorage.setItem("historynameid",val);
          window.localStorage.setItem("isReturn",1);
          window.location.href="track-details.html";
        },
        allSelectTeam:function(index,id){ //车辆的全选和全不选
          // this.count[this.teamId].teamId.push(id)
          var _this = this;
          if(this.count[index].isAll==0){ //不是全选
             this.count[index].num = this.count[index].allCount;
             this.count[index].isAll= 1;
             _this.carCount= 0;
             for(var m=0;m<_this.count.length;m++){
               _this.carCount += parseInt(_this.count[m].num);
             }
             var _url = "queryCars.jsp?"+this.params+"&teamId="+id;
             this.count[index].teamId = [];
             webComm.loadingShow(); //loading动画显示
             webComm.AS.baseRequest(_url,{
                              data: {},
                              callback: function(res) {
                                 res = JSON.parse(res);
                                 for(var m=0;m<res.length;m++){
                                   _this.count[index].teamId.push(res[m].id);
                                   _this.count[index].teamItems.push(m);
                                 }
                                 $(".loaderContainer").hide();  //loading动画隐藏
                              },
                              errorback:function(res){
                               //  console.log(res);
                              }
                          });
          }else{
            this.count[index].num = 0;
            this.count[index].isAll= 0;
            this.count[index].teamId = [];
            this.count[index].teamItems = [];
            _this.carCount= 0;
            for(var m=0;m<_this.count.length;m++){
              _this.carCount += parseInt(_this.count[m].num);
            }
          }
        },
        resetSelected:function(){ //重置车队选择
           var _this = this;
           for(var m=0;m<_this.count.length;m++){
             _this.count[m].num = 0;
             _this.count[m].teamItems = [];
             _this.count[m].teamId = [];
             _this.count[m].isAll = 0;
             _this.carCount = 0;
           }
        },
        resetSelectedCar:function(){ //重置车辆选择
           var _this = this;
           this.count[this.teamId].num = 0;
           this.count[this.teamId].teamItems = [];
           this.count[this.teamId].teamId = [];
           this.count[this.teamId].isAll = 0;
        },
        hasAlarm:function(){///是否有报警
           var _url = "queryRealAlarm.jsp?"+this.params;
          var _this = this;
          webComm.AS.baseRequest(_url,{
                           data: {},
                           callback: function(res) {
                              res = JSON.parse(res);
                             
                             if (res.length>0) {
                                _this.untreated=true;
                             };
                           },
                           errorback:function(res){
                           }
                       });
        }
      },
      mounted: function() {
        this.params = window.localStorage.getItem("username");
        if (this.params == null) {
            window.localStorage.setItem("goPages",'real-time');
            window.location.href="index.html?1"
        }else{
        this.allCarInfo();
        this.hasAlarm();
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
      $(".carNowInfo").hide();
   })
  $(document).on('click',".BMap_mask",function(){
     $(".carNowInfo").hide();
  })
})
