
var watchPage = new Vue({
      template: "#app-warnWatch",
      el: '#warnWatch',
      data: {
        params:'',//本地缓存params
        isWorked:0, //未处理
        data1:[], //警报的车辆列表
        count1:0,
        data2:[], //报警类型
        data3:[],//报警的车辆集合（未处理、已处理）
        data4:[],//未处理报警的车辆集合
        data5:[],//已处理报警的车辆集合
        isData4:false, //是否已调取未处理的接口
        isData5:false, //是否已调取未处理的接口
        viewPages:true,
        searchPages:false,//搜索页面
        defaultShow:true,
        rightContent:false, //筛选页面
        warnPage:true, //报警页面
        warnTypeHide:false,  //筛选报警类型页面
        filerCarlists:false, //车辆列表页面
        carsId:[], // 选中的报警类型
        alarmNum:'',//报警类型已选择/未选择
        cars:[], //选中的车辆ids
        allCars:[], //搜索页面的数据 未处理
        unCars:[],//搜索页面的数据 已处理
        selectArr:[],
        vauleInput:'',        
        str:'未处理'        
      },
      watch:{
        vauleInput:function(newVal,oldVal){ 
            if(this.vauleInput!=''){
                var str = '',arr=[];
                if(this.isWorked==0){                	
                  arr = this.allCars;
                }else{
                  arr = this.unCars;
                }

                for (var i = 0; i < arr.length; i++) {
                  var changeIndex= arr[i].plate.indexOf(newVal);

                    if (changeIndex!=-1) {
                      this.selectArr.push(arr[i]);
                    };
                };
               $(".search-con").html(str);
            }else{
              $('.search-con li').hide();
            }
        }
      },
      methods: {
        showRightContent:function(){ //筛选页面
//      	this.loadWarn('');
        	this.defaultShow=false;
        	this.rightContent = true;        	
        },
        warnDetail:function(data){ //点击报警车辆进入报警详情页
          var str = '';
          for(var i in data){
            str+=i+"&"+data[i]+"&&";
          }
          console.log(str);
          window.localStorage.setItem("carWarnWatch",str);
          window.location.href="warnDetail.html";
        },
        turnSearch:function(){//搜索跳转搜索页
          this.viewPages = false;
          this.searchPages = true;
        },
        isWorkBtn:function(){ //未处理
          this.isWorked = 0;
          this.carsId = [];
          this.cars = [];
          this.data1 = [];
          if(!this.isData4){
          	this.isData4 = true;
          	this.loadWarn('');
          }else{
          	this.data3 = this.data4;
          }
          
        },
        WorkedBtn:function(){ //已处理
          this.isWorked = 1;
          this.carsId = [];
          this.cars = [];
          this.data1 = [];
          if(!this.isData5){
          	this.isData5 = true;
          	this.loadWarn('');
          }else{
          	this.data3 = this.data5;
          }
        },
        searchResult:function(id){ //搜索结果 点击事件
          this.searchPages = false;
          this.viewPages = true;
          var _cars = this.cars;
          for(var i=0;i<_cars.length;i++){
            if(_cars[i]==id){
              return false;
            }
          };
          this.cars.push(id);
          this.vauleInput = '';
        },
        cancelSearch:function(){
          this.searchPages = false;
          this.viewPages = true;
          this.selectArr = [];
          this.vauleInput = '';
        },
        showCarsList:function(id){ //跳转车辆列表页面           	
          this.warnPage=false;
          this.warnTypeHide=false;
        	this.filerCarlists = true;        	
        },
        goWarnType:function(){ //跳转报警类型页面
          this.warnPage=false;
          this.filerCarlists = false;
          this.warnTypeHide=true;
          var _this = this;
          if(this.data2.length==0){
          	webComm.loadingShow(); //loading动画显示
          	var _url = "queryAlarmType.jsp?"+this.params;
	          webComm.AS.baseRequest(_url,{
	                    data: {},
	                    callback: function(res) {
	                      $(".loaderContainer").hide();  //loading动画隐藏
	                      res = JSON.parse(res);
	                      if(res.length>0){
	                       _this.data2 = res;
	                      }
	
	                    },
	                    errorback:function(res){
	                      console.log(res);
	                      webComm.alertComponent("网络缓慢");
	                    }
	                });
          }          
          
        },
        sureSelected:function(){ //报警页面确认按钮
          webComm.loadingShow(); //loading动画显示
          this.rightContent = false;
          this.defaultShow=true;
          var _cars = this.cars;
          var carsId = this.carsId;
          var str = '',str1 = '',_url='';
          for(var m=0;m<_cars.length;m++){
             str += ',' +  _cars[m];
          }
          for(var n=0;n<carsId.length;n++){
            str1 += ',' +  carsId[n];
          }
          str = str.substring(1);
          str1 = str1.substring(1);
          if(str!=''){
            _url += '&carIds='+str;
          }
          if(str1!=''){
            _url += '&alarmTypes='+str1;
          }
          console.log(_url);
          this.data1 = [];
          this.loadWarn(_url);
        },
        resetSelected:function(){ //报警页面重置按钮
          this.carsId = [];
          this.cars = [];
        },
        selectCars:function(index,id){ //选择车辆
          var _ids = this.cars;
          if(_ids.indexOf(id)==-1){
            this.cars.push(id);
          }else{
            for(var m=0;m<_ids.length;m++){
               if(_ids[m]==id){
                  this.cars.splice(m,1);
                  return false;
               }
            }
          }
        },
        sureCarList:function(){ //车辆列表页面确认按钮
          this.filerCarlists = false;
        	this.warnPage=true;
        },
        resetCarList:function(){ //车辆列表页面重置按钮
          this.cars = [];
        },
        selectCarType:function(index,id){ //选择车辆类型
          if(this.carsId.indexOf(id)==-1){
            this.carsId.push(id);
            if(this.carsId.length==this.data2.length) {
              this.carsId.push('all');
            };
          }else{
            for(var m=0;m<this.carsId.length;m++){
               if(this.carsId[m]==id){
                  this.carsId.splice(m,1);
                  // console.log("all");
                  if (this.carsId.length==this.data2.length) {
                    for (var i = 0; i < this.carsId.length; i++) {
                      if (this.carsId[i]=='all') {
                        // console.log("alls");
                        this.carsId.splice(i,1);
                      };
                    };
                  };
                  return false;
               }
            }
          }          
        },
        selectAll:function(){//全选
          // console.log(this.data2.length)
          if (this.carsId.indexOf('all')>-1) {
            this.carsId=[];
            // console.log(this.carsId);
          }else{
            this.carsId=[];
            for (var i = 0; i < this.data2.length; i++) {
              this.carsId.push(this.data2[i].id);
            };
            this.carsId.push('all');
          };
          // console.log(this.carsId);
        },
        sureWarnType:function(){ //筛选报警类型页面确认按钮
          this.warnTypeHide = false;
          this.warnPage=true;
          if (!this.carsId.length == 0) {
            this.alarmNum = '已选择'
          }else{
            this.alarmNum = ''
          };
        },
        resetWarnType:function(){ //筛选报警类型页面重置按钮
          this.carsId = [];
        },
        loadWarn:function(val){
          var _this = this;
          _this.data1 = [];
          _this.count1 = 0;
          var _url = '';
          if(_this.isWorked==0){ //判断是否已处理列表 还是 未处理列表
          	_this.str = '未处理';
            _url = "queryRealAlarm.jsp?"+this.params+val;
          }else{
          	_this.str = '已处理';
            _url = "queryHisAlarm.jsp?"+this.params+val;
          }
          console.log(_url);
          webComm.AS.baseRequest(_url,{
                    data: {},
                    callback: function(res) {
                      $(".loaderContainer").hide();  //loading动画隐藏
                       res = JSON.parse(res);
                       console.log(res);
                      if(res.length>0){
                        _this.count1 = res.length;
                        for(var i=0;i<res.length;i++){
                          if(res[i].picUrl!=''){
                            res[i].picUrl = webComm.AS.res_url+res[i].picUrl;
                          }
                          if(res[i].vidUrl!=''){
                            res[i].vidUrl = webComm.AS.res_url+res[i].vidUrl;
                          }
                        }
                        _this.data1 = res;
                        
                        //加载搜索的总车辆数据
                        if(_this.isWorked==0){ //未处理的车辆列表
                           if(_this.allCars.length==0){
                             for(var i=0;i<res.length;i++){
                               var json = {}
                                json.id = res[i].carId;
                                json.carId = res[i].carId;
                                json.plate = res[i].plate;
                                _this.allCars.push(json);
                             }
                             _this.allCars=webComm.unDouble(_this.allCars);                             
                           }
                           _this.data4 = _this.allCars;
                           _this.data3 = _this.data4;
                        }else{
                          if(_this.unCars.length==0){
                            for(var i=0;i<res.length;i++){
                              var json = {}
                               json.id = res[i].carId;
                               json.carId = res[i].carId;
                               json.plate = res[i].plate;
                               _this.unCars.push(json);                               
                            }
                            _this.unCars=webComm.unDouble(_this.unCars);
                          }
                          _this.data5 = _this.unCars;
                          _this.data3 = _this.data5;
                        }

                      }else{

                      }

                    },
                    errorback:function(res){
                      console.log(res);
                       $(".loaderContainer").hide();  //loading动画隐藏
                      webComm.alertComponent("网络缓慢");
                    }
                });
        }
      },
      mounted: function() {
        this.params = window.localStorage.getItem("username");
        if (this.params == null) {
            window.localStorage.setItem("goPages",'warnWatch');
            window.location.href="index.html?1"
        }else{
        webComm.loadingShow(); //loading动画显示
        this.isWorkBtn();
      }
      }
    });

