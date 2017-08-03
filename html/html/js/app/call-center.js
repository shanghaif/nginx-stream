

var trackPage = new Vue({
      template: "#app-centerPage",
      el: '#centerPage',
      data: {
        params:"",
        carTab:0,
        repeatTab:0,
        warnTypeHide:false,
        warnTypeHide2:false,
        centerShow:true,
        rightCarList:false,
        teamitems:[],
        teamsCaritems:[],
        carLisrId:'',
        carLisrName:'',
        teamLisrId:'',
        teamListName:'',  //车队名字
        alarmListId:[],//报警类型
        alarmName:'',//报警类型已选择/未选择
        alarmListId2:'',
        alarmitems:[],
        alarmitems2:[],
        startDate:'',
        endDate:'',
        carInfo:[],
        imgUrl:[],
        vidUrl:[],
        centerShow:true,
        viewPage : true,
        allCars:[], //搜索页面的数据
        searchPages:false, //搜索页面
        selectArr:[],
        items:[],
        myInput:'',
        alarmIdAll:[],//报警类型所有id
        vauleInput:'', //搜索
        searchType:'0' //判断搜索是报表查询还是照片查询 0报表 1照片
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
       carFormTab:function(){
          this.carTab=0;
          this.carLisrName='';
          this.carLisrId='';
          this.alarmListId=[];
          this.alarmListId2='';
          this.alarmName = '';
          $(".watch-right-top .watch-right-top-top").find("b").removeClass("show").addClass("hide");
        $(".watch-right-ul").hide();
       },
       teamFormTab:function(){
          this.carTab=1;
          this.carLisrName='';
          this.carLisrId='';
          this.alarmListId=[];
          this.alarmListId2='';
          this.alarmName = '';
          $(".watch-right-top .watch-right-top-top").find("b").removeClass("show").addClass("hide");
        $(".watch-right-ul").hide();
       },
       reportTab:function(){
          this.repeatTab=0;
           this.carLisrName='';
          this.carLisrId='';
          this.alarmListId=[];
          this.alarmListId2='';
          this.alarmName = '';
          $(".watch-right-top .watch-right-top-top").find("b").removeClass("show").addClass("hide");
        $(".watch-right-ul").hide();
       },
       photoTab:function(){
          this.repeatTab=1;
          this.carLisrName='';
          this.carLisrId='';
          this.alarmListId=[];
          this.alarmListId2='';
          this.alarmName = '';
          $(".watch-right-top .watch-right-top-top").find("b").removeClass("show").addClass("hide");
        $(".watch-right-ul").hide();
       },
       turnSearch:function(val){//搜索跳转搜索页
          this.viewPage = false;
          this.searchPages = true;
          this.searchType = val; //判断是报表还是照片查询的搜索
          this.searchCarList(); //加载搜索的车辆列表
       },
       searchCarList: function(id){//车辆的列表信息
          var _url = "queryCars.jsp?"+this.params;
          var _this = this;
          webComm.AS.baseRequest(_url,{
                           data: {},
                           callback: function(res) {
                              res = JSON.parse(res);
                              _this.allCars=res;
                              console.log(res);
                           },
                           errorback:function(res){
                             console.log(res);
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
          _this.carLisrName = item.plate;
          //$('.mySearchInput').html(item.plate); //搜索的数据
          _this.carLisrId = item.id;
          this.selectArr = [];
          this.vauleInput = '';
       },
       cancelSearch:function(){ //搜索结果页的取消事件
          this.selectArr = [];
          this.vauleInput = '';
          this.searchPages = false;
          this.viewPage = true;
        },
       selectCar:function(id,plate){//选中车辆
        this.carLisrId = id;
        this.carLisrName = plate;
       },
       selectTeam:function(id,name){//选中车队
        this.teamLisrId = id;
        this.teamListName = name;
        $(".watch-right-top .watch-right-top-top").find("b").removeClass("show").addClass("hide");
        $(".watch-right-ul").hide();
       },
       caesMakesure:function(){//选车辆的确认按钮
          $(".watch-right-top .watch-right-top-top").find("b").removeClass("show").addClass("hide");
          $(".watch-right-ul").hide();
          this.rightCarList = false;
          this.centerShow = true;
       },
       alarmTypeMakesure:function(){//报警类型确定按钮
        this.warnTypeHide =false;
        this.centerShow = true;
        repeatTab =1;
         if (!this.alarmListId.length == 0) {
            this.alarmName = '已选择'
          }else{
            this.alarmName = ''
          };
          console.log(this.alarmListId)
       },
       PICalarmTypeMakesure:function(){//照片报警类型确定按钮
        this.warnTypeHide2 =false;
        this.centerShow = true;
        repeatTab =1;
         if (!this.alarmListId2.length == 0) {
            this.alarmName = '已选择'
          }else{
            this.alarmName = ''
          };
       },
       alarmReset:function(){//报警类型重置按钮
          this.alarmListId=[];
          this.alarmListId2='';
       },
       alarmType:function(){//报警类型
          this.warnTypeHide = true;
          this.centerShow = false;
         var _url = "queryAlarmType.jsp?"+this.params;
          var _this = this;
          webComm.AS.baseRequest(_url,{
               data: {},
               callback: function(res) {
                  console.log(res);
                  res = JSON.parse(res);
                  _this.alarmitems = res;
                  for (var i = 0; i < res.length; i++) {
                   _this.alarmIdAll.push(res[i].id)
                  };
                  // console.log(_this.alarmIdAll);
               },
               errorback:function(res){
                //  console.log(res);
               }
           });
       },
       PICalarmType:function(){//照片报警类型
          this.warnTypeHide2 = true;
          this.centerShow = false;
         var _url = "queryAlarmType.jsp?"+this.params;
          var _this = this;
          webComm.AS.baseRequest(_url,{
               data: {},
               callback: function(res) {
                  console.log(res);
                  res = JSON.parse(res);
                  _this.alarmitems2 = res;
                  // console.log(res);
               },
               errorback:function(res){
                //  console.log(res);
               }
           });
       },
       PICalarmTypeSelect:function(id){//图片报警类型  单选
          this.alarmListId2 = id;
       },
       alarmTypeSelect:function(id){//报警类型  多选
          if (this.alarmListId.indexOf(id)==-1) {
            this.alarmListId.push(id);
            if (this.alarmListId.length==this.alarmitems.length) {
              this.alarmListId.push('all');
            };
          }else{
            for (var i = 0; i < this.alarmListId.length; i++) {
              if (this.alarmListId[i]==id) {
                this.alarmListId.splice(i,1);
                if (this.alarmListId.length==this.alarmitems.length) {
                  for (var m = 0; m < this.alarmListId.length; m++) {
                    if (this.alarmListId[m]=='all') {
                      this.alarmListId.splice(m,1);
                    };
                  };
                };
              };
            };
          };
       },
       selectAll:function(){//报警类型  全选
          if (this.alarmListId.indexOf('all')>-1) {
            this.alarmListId=[];
            // console.log(this.alarmListId);
          }else{
            this.alarmListId=[];
            for (var i = 0; i < this.alarmitems.length; i++) {
              this.alarmListId.push(this.alarmitems[i].id);
            };
            this.alarmListId.push('all');
          };
          // console.log(this.alarmListId);
        },
        photoMakesure:function(start,end){//照片查询
            var $startDate = $(start).val();
            var $endDate = $(end).val();
            if (this.carLisrId == '') {
              webComm.alertComponent("请选择车辆");
              return false;
            };
            if($startDate==''||$endDate==''){
                webComm.alertComponent("请选择时间");
               return false;
            };
             if (this.alarmListId2 == '') {
              webComm.alertComponent("请选择报警类型");
              return false;
            };

            $startDate = webComm.transDate($startDate).toString();
            $endDate = webComm.transDate($endDate).toString();
            this.startDate = $startDate;
            this.endDate = $endDate;
            
            var panduanStart = $startDate;
            var panduanEnd = $endDate;
            panduanStart = panduanStart.replace('-','/');
            panduanStart = panduanStart.replace('-','/');
            panduanEnd = panduanEnd.replace('-','/');
            panduanEnd = panduanEnd.replace('-','/');
            var _startDate1 = new Date(panduanStart).getTime();
            var _endDate1 = new Date(panduanEnd).getTime();
            if(_startDate1>=_endDate1){
              webComm.alertComponent("开始时间不允许大于结束时间");
              return false;
            };
            if(_endDate1-_startDate1>86400000){
              webComm.alertComponent("请选择时间间隔为一天内");
              return false;
            };
            var _this = this;

            
             if(_this.repeatTab==1){
              var strId = _this.alarmListId2;
            }else{
              var strId = webComm.returnStr(_this.alarmListId);
            }
            var _url = "queryRptVhcAlarmChart.jsp?"+_this.params;

            var data = {
                 carId:_this.carLisrId,
                 stime:$startDate,
                 etime:$endDate,
                 alarmTypes:strId
            }
            console.log(data)
            webComm.loadingShow(); //loading动画显示
            webComm.AS.baseRequest(_url,{
                      data: data,
                      callback: function(res) {
                         res = JSON.parse(res);
                         $(".loaderContainer").hide();  //loading动画隐藏
                         _this.carInfo= res;
                        console.log(res)
                        var str ='',addrStr ='';
                        for(var m in _this.carInfo){
                          console.log( _this.carInfo[m].length)
                         for (var i = 0; i < _this.carInfo[m].length; i++) {
                           if (_this.carInfo[m][i].picUrl!='') {
                              str +=  webComm.AS.res_url + _this.carInfo[m][i].picUrl+'&';
                              addrStr += _this.carInfo[m][i].addr+'&&&';
                           };
                           if (_this.carInfo[m][i].vidUrl!='') {
                            str += '<video src="'+webComm.AS.res_url + _this.carInfo[m][i].vidUrl+'" autoplay="autoplay" ></video>'+'&';
                            addrStr += _this.carInfo[m][i].addr+'&&&';
                           };
                           
                         };
                        }
                        // console.log(str)
                          if (str == '') {
                               webComm.alertComponent("无数据");
                          }else{
                             str = str.substring(0,str.length-1);
                             addrStr = addrStr.substring(0,addrStr.length-3);
                            window.localStorage.setItem("carPhotoUrl",str);
                            window.localStorage.setItem("carPhotoUrlAddr",addrStr);
                            window.location.href="photo.html";
                          };
                          
                      },
                      errorback:function(res){
                        $(".loaderContainer").hide();  //loading动画隐藏
                        webComm.alertComponent("网络缓慢");
                      }
                  });
                       
        },
        carMakesure:function(start,end){//车辆查询
            var _this = this;
            var $startDate = $(start).val();
            var $endDate = $(end).val();
            if(_this.carLisrId==''){
                webComm.alertComponent("请选择车辆");
               return false;
            };
            if($startDate==''||$endDate==''){
                webComm.alertComponent("请选择时间");
               return false;
            };
            $startDate = webComm.transDate($startDate).toString();
            $endDate = webComm.transDate($endDate).toString();
            var panduanStart = $startDate;
            var panduanEnd = $endDate;
            $startDate = $startDate.replace('-','/');
            $startDate = $startDate.replace('-','/');
            $endDate = $endDate.replace('-','/');
            $endDate = $endDate.replace('-','/');
            this.startDate = $startDate;
            this.endDate = $endDate;
            _startDate = new Date($startDate).getTime();
            _endDate = new Date($endDate).getTime();
            if(_startDate>=_endDate){
              webComm.alertComponent("开始时间不允许大于结束时间");
              return false;
            };            
            var strId = webComm.returnStr(_this.alarmListId);
            var allStrId = webComm.returnStr(_this.alarmIdAll);
            // var data = {
            //      carId:_this.carLisrId,
            //      stime:$startDate,
            //      etime:$endDate,
            //      alarmTypes:strId
            // }
            if (_this.alarmListId == '') {
                var stringCar = _this.carLisrId+'&'+panduanStart+'&'+panduanEnd+'&'+allStrId;
            }else{
                var stringCar = _this.carLisrId+'&'+panduanStart+'&'+panduanEnd+'&'+strId;
            };
            window.localStorage.setItem("carsInfo",stringCar);
            window.location.href="formResult.html";
                       
        },
        teamMakesure:function(start,end){//车队查询
            var _this = this;
            var $startDate = $(start).val();
            var $endDate = $(end).val();
            if(_this.teamLisrId==''){
                webComm.alertComponent("请选择车队");
               return false;
            };
            if($startDate==''||$endDate==''){
                webComm.alertComponent("请选择时间");
               return false;
            };
            var myDate = new Date(); 
            var date = myDate.getMonth()+1;
            var today = myDate.getFullYear()+'/'+date+'/'+myDate.getDate()+' '+'00:00:00';
            $today = new Date(today).getTime();
            //$startDate = webComm.transDate($startDate).toString();
            //$endDate = webComm.transDate($endDate).toString();
            $startDate = $startDate.replace('年','/');
            $startDate = $startDate.replace('月','/');
            $startDate = $startDate.replace('日','');
            $endDate = $endDate.replace('年','/');
            $endDate = $endDate.replace('月','/');
            $endDate = $endDate.replace('日','');
            this.startDate = $startDate;
            this.endDate = $endDate;
            var str00 = new Date($startDate);
            var str11 = new Date($endDate);
            _startDate = str00.getTime();
            _endDate = str11.getTime();
            
            if(_startDate>_endDate){
              webComm.alertComponent("开始时间不允许大于结束时间");
              return false;
            };           
            if(_endDate >= $today){
                webComm.alertComponent("不能选择当天日期");
               return false;
            };
            //return false;
            var strId = webComm.returnStr(_this.alarmListId);
                        
            var str00M =  parseInt(str00.getMonth())+1<10?'0'+(parseInt(str00.getMonth())+1):parseInt(str00.getMonth())+1;
            var str00D =  str00.getDate()<10?'0'+str00.getDate():str00.getDate();
            var str11M =  parseInt(str11.getMonth())+1<10?'0'+(parseInt(str11.getMonth())+1):parseInt(str11.getMonth())+1;
            var str11D =  str11.getDate()<10?'0'+str11.getDate():str11.getDate();
            var str0000 = str00.getFullYear()+'/'+str00M+'/'+str00D;
            var str1111 = str11.getFullYear()+'/'+str11M+'/'+str11D;
            var stringCar = _this.teamLisrId+'&'+str0000+'&'+str1111+'&'+strId;
            window.localStorage.setItem("carsInfo",stringCar);
            window.location.href="formResult2.html";

            /*var _url = "queryRptTeamAlarmChart.jsp?"+_this.params;
            var data = {
                 teamId:_this.teamLisrId,
                 stime:$startDate,
                 etime:$endDate,
                 alarmTypes:strId
            }
            console.log(data)
            webComm.loadingShow(); //loading动画显示
            webComm.AS.baseRequest(_url,{
                      data: data,
                      callback: function(res) {
                         
                         // res = JSON.parse(res);
                         $(".loaderContainer").hide();  //loading动画隐藏
                         _this.teaminfo= res;
                         res = JSON.parse(res);
                        console.log(res)
                        var teamStr ='';
                          console.log( _this.teaminfo.length)
                         for (var i = 0; i < _this.teaminfo.length; i++) {
                          if (_this.teaminfo[i].picUrl!='') {
                              teamStr +=  webComm.AS.res_url + _this.teaminfo[i].picUrl+'&';
                           };
                           if (_this.teaminfo[i].vidUrl!='') {
                            teamStr += '<video src="'+webComm.AS.res_url + _this.teaminfo[i].vidUrl+'" ></video>'+'&';
                           };
                            teamStr += _this.teaminfo[i].teamId+'&'+_this.teaminfo[i].stime+'&'+_this.teaminfo[i].etime+'&'+_this.teaminfo[i].alarmTypes +'&&'
                         };

                        
                        teamStr = teamStr.substring(0,teamStr.length-2)
                        console.log(teamStr)
                          window.localStorage.setItem("teamInfo",teamStr);
                          // window.location.href="photo.html";
                      },
                      errorback:function(res){
                        $(".loaderContainer").hide();  //loading动画隐藏
                        webComm.alertComponent("网络缓慢");
                      }
                  });*/
        },
       teams:function(){//车队

          var _url = "queryTeams.jsp?"+this.params;
          var _this = this;
          
          webComm.AS.baseRequest(_url,{
               data: {},
               callback: function(res) {
                  console.log(res);
                  res = JSON.parse(res);
                  _this.teamitems = res;
                  // console.log(_this.teamitems);
               },
               errorback:function(res){
                //  console.log(res);
               }
           });
          
       },
       teamsCars:function(teamId){//指定车队下 车辆信息
          this.rightCarList = true;
          this.centerShow = false;
          var _url = "queryCars.jsp?"+this.params+"&teamId="+teamId;
          var _this = this;
          webComm.AS.baseRequest(_url,{
               data: {},
               callback: function(res) {
                  console.log(res);
                  res = JSON.parse(res);
                  _this.teamsCaritems = res;
                  // console.log(res);
               },
               errorback:function(res){
                 console.log(res);
               }
           });
       },
        reset:function(){ //重置选择车辆
          this.carLisrId = '';
          this.carLisrName = '';
        }
      },
      mounted: function() {
        this.params = window.localStorage.getItem("username");
        if (this.params == null) {
            window.localStorage.setItem("goPages",'call-center');
            window.location.href="index.html?1"
        }else{
          this.teams();
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
})
