

var trackPage = new Vue({
      template: "#app-trackWatch",
      el: '#trackWatch',
      data: {
        params:"",
        filterBtn:false,  //顶部筛选按钮
        windowInfo:false, //底部车辆信息的弹窗
        carTeams:[],//车队的集合
        carArr:[],//车辆的集合
        selectedCar:"",//选中查看历史轨迹的车辆
        selectedCarId:"",//选中查看历史轨迹的车辆Id
        speedMax:180, //速度的阀值
        historyData:{
          avgSpeed:'',
          moveLong:'',
          stopLong:'',
          maxSpeed:''
        },
        historyList:[{addr:''}],
        start1:'',
        end1:'',
        data1:'',//阀值
        echartsData:{ //echarts数据
          time:[],
          data:[]
        },
        startDate:'',
        endDate:'',
        allCars:[], //搜索页面的数据
        selectArr:[],
        vauleInput:'',
        map:null,
        zoomend:16, //地图缩放的级别
        centerLng:'',
        centerLat:''
      },
      methods: {
        showRightContent:function(){
           var val = this.selectedCar+'&'+this.selectedCarId;
           window.localStorage.setItem("historynameid",val);
           window.localStorage.setItem("isReturn",1);
           window.location.href= "track-details.html";
        },
        startSearch:function(){ //开始查询历史轨迹
          webComm.loadingShow(); //loading动画显示
          var _this = this;
          var $page = window.localStorage.getItem("trackmap1");
          var arr = $page.split("&&");
          _this.selectedCarId = arr[0];
         var startDate1 = new Date(Math.floor(arr[1]));
         var endDate1 = new Date(Math.floor(arr[2]));
         var startStr = startDate1.getFullYear()+'年'+Math.floor(Math.floor(startDate1.getMonth())+1)+'月'+startDate1.getDate()+" "+startDate1.getHours()+':'+startDate1.getMinutes();
         var $startDate = webComm.transDate(startStr);
         var endStr = endDate1.getFullYear()+'年'+Math.floor(Math.floor(endDate1.getMonth())+1)+'月'+endDate1.getDate()+" "+endDate1.getHours()+':'+endDate1.getMinutes();
         var $endDate = webComm.transDate(endStr);
         //底部弹窗的日期显示格式
         var str1 = Math.floor(Math.floor(startDate1.getMonth())+1);
         var str11 = Math.floor(startDate1.getDate());
         var str2 = Math.floor(Math.floor(endDate1.getMonth())+1);
         var str22 = Math.floor(endDate1.getDate());
         var start2 = str1<10?'0'+str1:str1;
         var start3 = str11<10?'0'+str11:str11;
         var end2 = str2<10?'0'+str2:str2;
         var end3 = str22<10?'0'+str22:str22;
         this.start1 = startDate1.getFullYear()+''+start2+''+start3;
         this.end1 = endDate1.getFullYear()+''+end2+''+end3;

        var _urls = "queryCars.jsp?"+_this.params;
         webComm.AS.baseRequest(_urls,{  //通过传入的车辆id获取车辆的车牌号
                   data: data,
                   callback: function(res) {
                      res = JSON.parse(res);
                      for(var i=0;i<res.length;i++){
                          if(_this.selectedCarId == res[i].id){
                              _this.selectedCar = res[i].plate;
                              break;
                          }
                      }
                   }
                 })

          var _url = "queryHisGis.jsp?"+_this.params;
          var data = {
               carId:_this.selectedCarId,
               stime:$startDate,
               etime:$endDate
          }
          //alert($startDate);
          //alert($endDate);
          webComm.AS.baseRequest(_url,{
                    data: data,
                    callback: function(res) {
                       res = JSON.parse(res);
                       if(res.list&&res.list.length>0){ //结果有历史轨迹信息
                         _this.historyData = res.data;
                         _this.historyList = res.list;
                         _this.rightContent = false;
                         _this.defaultShow=true;
                         _this.filterBtn = true;
                         for(var i=0;i<res.list.length;i++){
                           _this.echartsData.time.push(res.list[i].time);
                           _this.echartsData.data.push(res.list[i].speed);
                         }
                         _this.windowInfo=true;
                         $(".loaderContainer").hide();  //loading动画隐藏
                         _this.map = null;          // 创建地图实例
                         _this.map = new BMap.Map("map-div");          // 创建地图实例
								          _this.map.addEventListener("zoomend",function(){//缩放完成时,触发
											         _this.zoomend = _this.map.getZoom();
											         _this.centerLng = _this.map.getCenter().lng ;
											         _this.centerLat = _this.map.getCenter().lat ;
											         _this.showMap(1);

											    });
											    _this.map.addEventListener("dragend",function(){//缩放完成时,触发
											         _this.centerLng = _this.map.getCenter().lng ;
											         _this.centerLat = _this.map.getCenter().lat ;
											         _this.showMap(1);
											         console.log(_this.zoomend);
											    });
                         _this.showMap(_this.map);
                       }else{
                       	 $(".loaderContainer").hide();  //loading动画隐藏
                         webComm.alertComponent("无历史轨迹数据");
                       }

                    },
                    errorback:function(res){
                      $(".loaderContainer").hide();  //loading动画隐藏
                      webComm.alertComponent("网络缓慢");
                    }
                });
        },
        showMap:function(val){
          var _this = this;
          var arr=[],arrDirc=[];
          _this.map.clearOverlays(); //清除所有的点标注
          for(var i=0;i<_this.historyList.length;i++){
            arr.push(new BMap.Point(_this.historyList[i].blng,_this.historyList[i].blat));  // 创建点坐标
          }
          // console.log(arr);
          var polyline = new BMap.Polyline(arr, {strokeColor:"#31a3e9", strokeWeight:3, strokeOpacity:1});   //创建折线
      	  _this.map.addOverlay(polyline);   //增加折线
      	  if(val && val==1){
      	  	this.directionShow(1);
      	  }else{
      	  	this.directionShow();
      	  }

            // function startEnd(point,url) {
            //    var myIcon = new BMap.Icon(url, new BMap.Size(40,40),{
            //       imageOffset: new BMap.Size(9, 12)
            //     });
            //     // 创建标注对象并添加到地图
            //      var marker = new BMap.Marker(point, {icon: myIcon});
            //      map.addOverlay(marker);    // 将标注添加到地图中
            // }
        },
        directionShow:function(val){
        	var _this =this;
        	var arr=[],arrDirc=[];
        	if(val && val==1){
        		_this.map.centerAndZoom(new BMap.Point(_this.centerLng,_this.centerLat), _this.zoomend);
	        	var bs = _this.map.getBounds();   //获取可视区域
						var bssw = bs.getSouthWest();   //可视区域左下角
						var bsne = bs.getNorthEast();   //可视区域右上角
						var _small = {lng:bssw.lng,lat:bssw.lat};
						var _big = {lng:bsne.lng,lat:bsne.lat};
	          for(var i=0;i<_this.historyList.length;i++){
	          	if(_this.historyList[i].blng>=_small.lng && _this.historyList[i].blat>=_small.lat && _this.historyList[i].blng<=_big.lng && _this.historyList[i].blat<=_big.lat){
	          		arr.push(new BMap.Point(_this.historyList[i].blng,_this.historyList[i].blat));  // 创建点坐标
	              arrDirc.push(_this.historyList[i].drct);
	          	}
	          }
        	}else{
        		for(var i=0;i<_this.historyList.length;i++){
	          		arr.push(new BMap.Point(_this.historyList[i].blng,_this.historyList[i].blat));  // 创建点坐标
	              arrDirc.push(_this.historyList[i].drct);
	          }
        	}
        	if(arr.length==0){
        		return false;
        	}
        	var arrLength = arr.length;
          var $start='',$end='';
          //if(arrLength==1){
              $start = new BMap.Point(_this.historyList[0].blng,_this.historyList[0].blat);
              addMarker($start, 0,0,'images/start.png');
              $end = new BMap.Point(_this.historyList[_this.historyList.length-1].blng,_this.historyList[_this.historyList.length-1].blat);
              addMarker($end, 0,0,'images/end_point.png');
          //}else{

           //   }
              if(_this.zoomend>11){
              	if(arrLength>=2000){ //添加方向的间隔
                  for(var m=1;m<arrLength-1;m++){
                    if(m%200==0){
                      addMarker(arr[m], 0,arrDirc[m],'images/dirc.png');
                    }
                  }
                }else if(arrLength>=1500){
                  for(var m=1;m<arrLength-1;m++){
                    if(m%160==0){
                      addMarker(arr[m], 0,arrDirc[m],'images/dirc.png');
                    }
                  }
                }else if(arrLength>=1000){
                  for(var m=1;m<arrLength-1;m++){
                    if(m%100==0){
                      addMarker(arr[m], 0,arrDirc[m],'images/dirc.png');
                    }
                  }
                }else if(arrLength>=600){
                  for(var m=1;m<arrLength-1;m++){
                    if(m%80==0){
                      addMarker(arr[m], 0,arrDirc[m],'images/dirc.png');
                    }
                  }
                }else if(arrLength>=200){
                  for(var m=1;m<arrLength-1;m++){
                    if(m%50==0){
                   addMarker(arr[m], 0,arrDirc[m],'images/dirc.png');
                    }
                  }
                }else if(arrLength>=50){
                  for(var m=1;m<arrLength-1;m++){
                    if(m%30==0){
                      addMarker(arr[m], 0,arrDirc[m],'images/dirc.png');
                    }
                  }
                }else if(arrLength>=10){
                  for(var m=1;m<arrLength-1;m++){
                    if(m%3==0){
                      addMarker(arr[m], 0,arrDirc[m],'images/dirc.png');
                    }
                  }
                }else{
                    for(var m=1;m<arrLength-1;m++){
                      if(m%2==0){
                        addMarker(arr[m], 0,arrDirc[m],'images/dirc.png');
                      }
                    }

                }
              }else if(_this.zoomend>8){
              	if(arrLength>=2000){ //添加方向的间隔
                  for(var m=1;m<arrLength-1;m++){
                    if(m%300==0){
                      addMarker(arr[m], 0,arrDirc[m],'images/dirc.png');
                    }
                  }
                }else if(arrLength>=1500){
                  for(var m=1;m<arrLength-1;m++){
                    if(m%200==0){
                      addMarker(arr[m], 0,arrDirc[m],'images/dirc.png');
                    }
                  }
                }else if(arrLength>=1000){
                  for(var m=1;m<arrLength-1;m++){
                    if(m%160==0){
                      addMarker(arr[m], 0,arrDirc[m],'images/dirc.png');
                    }
                  }
                }else if(arrLength>=600){
                  for(var m=1;m<arrLength-1;m++){
                    if(m%100==0){
                      addMarker(arr[m], 0,arrDirc[m],'images/dirc.png');
                    }
                  }
                }else if(arrLength>=200){
                  for(var m=1;m<arrLength-1;m++){
                    if(m%80==0){
                   addMarker(arr[m], 0,arrDirc[m],'images/dirc.png');
                    }
                  }
                }else if(arrLength>=50){
                  for(var m=1;m<arrLength-1;m++){
                    if(m%30==0){
                      addMarker(arr[m], 0,arrDirc[m],'images/dirc.png');
                    }
                  }
                }else if(arrLength>=25){
                  for(var m=1;m<arrLength-1;m++){
                    if(m%10==0){
                      addMarker(arr[m], 0,arrDirc[m],'images/dirc.png');
                    }
                  }
                }else if(arrLength>=10){
                  for(var m=1;m<arrLength-1;m++){
                    if(m%5==0){
                      addMarker(arr[m], 0,arrDirc[m],'images/dirc.png');
                    }
                  }
                }else{
                    for(var m=1;m<arrLength-1;m++){
                      if(m%2==0){
                        addMarker(arr[m], 0,arrDirc[m],'images/dirc.png');
                      }
                    }

                }
              }


                if(val && val==1){
                	this.map.centerAndZoom(new BMap.Point(_this.centerLng,_this.centerLat), _this.zoomend);                 // 初始化地图，设置中心点坐标和地图级别
                }else{
                	_this.map.centerAndZoom(arr[0], _this.zoomend);                 // 初始化地图，设置中心点坐标和地图级别
                }

            //addMarker(point, 0)
	          function addMarker(point, index,num,url){  // 创建图标对象
	                var myIcon = new BMap.Icon(url, new BMap.Size(40,40),{
	                  imageOffset: new BMap.Size(9, 12)
	                });
	                // 创建标注对象并添加到地图
	                 var marker = new BMap.Marker(point, {icon: myIcon,rotation:num});
	                 _this.map.addOverlay(marker);    // 将标注添加到地图中
	            }
        },
        goSpeed:function(){ //超速分析页面
          window.location.href="overSpeed.html";
        }
      },
      mounted: function() {
        this.params = window.localStorage.getItem("username");
        this.startSearch();
      }
    });
