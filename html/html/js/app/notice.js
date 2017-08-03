
var noticePage = new Vue({
      template: "#app-noticePage",
      el: '#noticePage',
      data: {
        params:'',
        defaultShow:true,
        rightContent:false, //筛选页面
        warnPage:true, //报警页面
        warnTypeHide:false,  //筛选报警类型页面
        filerCarlists:false,//车辆列表页面
        alarm:0,//报警处理统计和违规车辆统计  切换
        viewPages:true,
        searchPage:false,//搜索页隐藏
        haveData:0,//判断图表是否有数据  0有数据 1正在加载数据 2无数据
        items:{},
        myChart:'',
        alarmNum:'',//是否选择已报晋
        alarmName:[],//报警名称
        alarmNameId:[],//报警名称id
        alarmIdStr:'',//报警名称id
        carTeam:[],//车队列表
        carTeamId:[],//选中车队列表id 多选
        carTeamName:'',//选中车队列表名字
        alarmAll:[],//总报警和违规车辆总数
        someInfo:{},//指定车辆 信息
        wranName:['全部', '待处理', '已处理', '及时处理', '延时处理'], //报警名字
        wranName2:['违规车辆总数', '未重犯车辆数', '再重犯车辆数'], //报警名字
        dataArr:[],
        warnMax:[],//报警  最大
        warnData:[],//报警 信息
        ruleName:[], //违规名字
        ruleMax:[],//违规最大
        ruleData:[]//违规信息
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
        showRightContent:function(){ //筛选页面
        	this.defaultShow=false;
        	this.rightContent = true;
        },
        showCarsList:function(){ //跳转车辆列表页面
          this.warnPage=false;
          this.warnTypeHide=false;
        	this.filerCarlists = true;
          this.selectCarTeam();
        },
        goWarnType:function(){ //跳转报警类型页面
          this.warnPage=false;
          this.filerCarlists = false;
          this.warnTypeHide=true;
        },
        sureSelected:function(){ //报警页面确认按钮//指定车辆数据渲染
          webComm.loadingShow(); //loading动画显示
          this.haveData = 1;
          this.rightContent = false;
        	this.defaultShow=true;
          var _this = this,
              _url = '';

          for (var i = 0; i < _this.alarmNameId.length; i++) {
            _this.alarmIdStr = _this.alarmIdStr+_this.alarmNameId[i]+',';
          };
          _this.alarmIdStr =_this.alarmIdStr.substring(0,_this.alarmIdStr.length-1);//_this.alarmIdStr就是被去掉了最后一个逗号的字符串
          console.log(_this.alarmIdStr);
          var carTeamStr =''
          for (var m = 0; m < _this.carTeamId.length; m++) {
            carTeamStr = carTeamStr+_this.carTeamId[m]+',';
          };
          carTeamStr =carTeamStr.substring(0,carTeamStr.length-1);
          _url = "queryWholeAlarm.jsp?"+this.params;
          if(carTeamStr!=''){
            _url+="&teamIds="+carTeamStr;
          }
          if(_this.alarmIdStr!=''){
            _url+="&alarmTypes="+_this.alarmIdStr;
          }
          webComm.AS.baseRequest(_url,{
                    data: {},
                    callback: function(res) {
                      console.log(res);
                      res = JSON.parse(res);
                      _this.items = res;
                      if(!$.isEmptyObject(_this.items)){
                      	_this.haveData = 0;
		                  	_this.refer();
		                  }else{
		                  	_this.haveData = 2;
		                  }
                       $(".loaderContainer").hide();  //loading动画隐藏
                    },
                    errorback:function(res){
                       $(".loaderContainer").hide();  //loading动画隐藏
                       webComm.alertComponent("网络缓慢");
                      _this.haveData = 2;
                    }
                });
        },
        sureCarList:function(){ //车辆列表页面认按钮
          this.filerCarlists = false;
        	this.warnPage=true;
        },
        sureWarnType:function(){ //筛选报警类型页面认按钮
          this.warnTypeHide = false;
          this.warnPage=true;
          if (!this.alarmNameId.length == 0) {
            this.alarmNum = '已选择';
          }else{
            this.alarmNum = '';
          };
        },
        alarm1:function(){//当天报警处理统计下页面显示
          this.alarm=0;
          this.refer();
        },
        alarm2:function(){//当天违规车辆统计下页面显示
          this.alarm=1;
          this.refer();
        },
        turnSearch:function(){ //搜索页跳转
          this.viewPages = false;
          this.searchPage=true;
        },
        refer:function(){
          var _this = this;
          var res = _this.items;
          if($.isEmptyObject(res)){
	            _this.haveData = 2;
	            return false;
	         }
          _this.haveData = 0;
	        if (_this.alarm==0) {
	            _this.alarmAll = {name:'总报警','data':res.alarm_count}
	            _this.dataArr = [
	            {name:'待处理','data':res.unhandle_alarm},
	            {name:'已处理','data':res.handle_alarm},
	            {name:'及时处理','data':res.time_alarm},
	            {name:'延时处理','data':res.untime_alarm}]
	          _this.warnData=[res.alarm_count,res.unhandle_alarm,res.handle_alarm,res.time_alarm,res.untime_alarm]
	          _this.warnMax =[res.alarm_count,res.alarm_count,res.alarm_count,res.alarm_count,res.alarm_count]
	          _this.Echart( _this.wranName, _this.warnMax, _this.warnData);
	        }else if(_this.alarm==1){
	          _this.alarmAll = {name:'违规车辆总数','data':res.vhc_count}
	          _this.dataArr = [
	            {name:'未重犯车辆数','data':res.unre_vhc},
	            {name:'再重犯车辆数','data':res.re_vhc}]
	          _this.ruleData=[res.vhc_count,res.unre_vhc,res.re_vhc]
	          _this.ruleMax =[res.vhc_count,res.vhc_count,res.vhc_count]
	          _this.Echart( _this.wranName2, _this.ruleMax, _this.ruleData);
	        };
        },
        alertProcessing:function(){//一开始页面数据渲染
          this.haveData = 1;
          webComm.loadingShow(); //loading动画显示
          var _url = "queryWholeAlarm.jsp?"+this.params+'&teamIds='+''+'&alarmTypes='+'';
          var _this = this;
          webComm.AS.baseRequest(_url,{
               data: {},
               callback: function(res) {
                console.log(res)
                  res = JSON.parse(res);
                  _this.items = res;
                  if(!$.isEmptyObject(_this.items)){
                  	_this.haveData = 0;
                  	_this.refer();
                  }else{
                  	_this.haveData = 2;
                  }
                
                  $(".loaderContainer").hide();  //loading动画隐藏
               },
               errorback:function(res){
                $(".loaderContainer").hide();  //loading动画隐藏
                webComm.alertComponent("网络缓慢");
                _this.haveData = 2;
               }
           });
        },
        Echart:function(wranName,warnMax,warnData){
        	  var _id = document.getElementById('echart1');
        	  _id.style.height = "9.5rem";
            this.myChart = echarts.init(document.getElementById('echart1'));
            option = {
                color: ['#31a3e9'],
                tooltip : {
                    show:false
                },
                calculable : true,
                grid: {
                    left: '1%',
                    right: '8%',
                    bottom: '3%',
                    containLabel: true
                },
                xAxis : [
                    {
                        type : 'category',
                        axisLabel:{    //坐标轴刻度标签
                          textStyle:{
                            color:'#55688d'
                          },
                          interval:0
                        },
                        data : wranName,
                        axisLine:{
                          lineStyle:{
                            color:"#e7e7e7"
                          }
                        },
                        axisTick: {
                            show: false //去掉X轴刻度
                        }
                    }
                ],
                yAxis :{
                  // show:false
                  axisLine:false,
                  splitLine:{
                    interval:3,
                    lineStyle:{
                      color:"#e7e7e7",
                      type:'dashed'
                    }
                  }
                },
                series : [
                    {
                        type: 'bar',
                        itemStyle: {
                            normal: {
                                color: '#ccdee9'  //背景阴影的颜色
                            }
                        },
                        silent: true,
                        barWidth: '22px',
                        barGap: '-100%', // Make series be overlap
                        data: warnMax //此处是最大值
                    },
                    {
                        type:'bar',
                        name:'',
                        barWidth: '22px',
                        data:warnData,
                        markPoint : {
                          silent:true,
                          data : warnData,
                          itemStyle:{
                            normal:{
                              opacity:'0',
                              color:"transparent"
                            },
                            emphasis:{
                              opacity:'1',
                              color:"red"
                            }
                          }
                      },
                        itemStyle:{  //图形的样式
                          normal:{
                            color:'#aac1d6', //柱条的颜色。 默认从全局调色盘 option.color 获取颜色。
                            label:{
                              show: true,
                              position: 'top',
                              textStyle : {
                                  fontSize : 14,
                                  fontFamily : '微软雅黑',
                                  color:'#333',
                                  marginBottom:10
                              },
                              formatter:function(value){
                                  //var value = parseFloat(value.data); //将数据转换为百分比
                                  //value = (value/count*100).toFixed(2)+'%';
                                  var str = '<b>'+value.data+'</b>';
                                  //return value.data;
                              }
                            }
                          },
                          emphasis:{
                            color:'#31a3e9' //柱条的颜色。柱条在高亮状态下的样式，比如在鼠标悬浮或者图例联动高亮时。
                          }

                        }
                    }
                ]
            };
            // 使用刚指定的配置项和数据显示图表。
            this.myChart.setOption(option);
        },
        selectCarTeam:function(){//选择车队数据
          var _this = this;
          var _url = "queryTeams.jsp?"+this.params;
          webComm.AS.baseRequest(_url,{
                    data: {},
                    callback: function(res) {
                      // console.log(res);
                      res = JSON.parse(res);
                       _this.carTeam = res;

                    },
                    errorback:function(res){
                      console.log(res);
                    }
                });
        },
        selectCars:function(id){ //选择车队
        	console.log(id);
          if (this.carTeamId.indexOf(id)==-1) {
            this.carTeamId.push(id);
            if (this.carTeamId.length==this.carTeam.length) {
              this.carTeamId.push('all');
            };
          }else{
            for (var i = 0; i < this.carTeamId.length; i++) {
              if (this.carTeamId[i]==id) {
                this.carTeamId.splice(i,1);
                if (this.carTeamId.length==this.carTeam.length) {
                  for (var m = 0; m < this.carTeamId.length; m++) {
                    if (this.carTeamId[m]=='all') {
                      this.carTeamId.splice(m,1);
                    };
                  };
                };
              };
            };
          };
        },
        selectAll:function(){//报警车队  全选
          if (this.carTeamId.indexOf('all')>-1) {
            this.carTeamId=[];
            // console.log(this.alarmListId);
          }else{
            this.carTeamId=[];
            for (var i = 0; i < this.carTeam.length; i++) {
              this.carTeamId.push(this.carTeam[i].id);
            };
            this.carTeamId.push('all');
          };
          // console.log(this.alarmListId);
        },
        alarmNameType:function(){//告警类型
          var _this = this;
          var _url = "queryAlarmType.jsp?"+this.params;
          webComm.AS.baseRequest(_url,{
                    data: {},
                    callback: function(res) {
                      // console.log(res);
                      res = JSON.parse(res);
                       _this.alarmName = res;
                    },
                    errorback:function(res){
                      console.log(res);
                    }
                });
        },
        selectName:function(id){//告警类型多选择效果
             if (this.alarmNameId.indexOf(id)==-1) {
                this.alarmNameId.push(id);
                if (this.alarmNameId.length==this.alarmName.length) {
                  this.alarmNameId.push('all1');
                };
              }else{
                for (var i = 0; i < this.alarmNameId.length; i++) {
                  if (this.alarmNameId[i]==id) {
                    this.alarmNameId.splice(i,1);
                    if (this.alarmNameId.length==this.alarmName.length) {
                      for (var m = 0; m < this.alarmNameId.length; m++) {
                        if (this.alarmNameId[m]=='all1') {
                          this.alarmNameId.splice(m,1);
                        };
                      };
                    };
                  };
                };
              };
        },
        selectAllName:function(){//报警类型  全选
          if (this.alarmNameId.indexOf('all1')>-1) {
            this.alarmNameId=[];
          }else{
            this.alarmNameId=[];
            for (var i = 0; i < this.alarmName.length; i++) {
              this.alarmNameId.push(this.alarmName[i].id);
            };
            this.alarmNameId.push('all1');
          };
        },
        resetCarTeam:function(){ //车队列表重置按钮
          this.carTeamId = [];
          this.carTeamName='';
        },
        resetType:function(){ //报警类型重置按钮
          this.alarmNameId = [];
          this.alarmIdStr = '';
        },
        resetSearch:function(){ //筛选重置按钮
          this.carTeamId = [];
          this.carTeamName='';
          this.alarmNameId = [];
          this.alarmIdStr = '';
          this.alertProcessing();
        }
      },
      mounted: function() {
      	var _this = this;
        this.params = window.localStorage.getItem("username");
        if (this.params == null) {
            window.localStorage.setItem("goPages",'notice');
            window.location.href="index.html?1"
        }else{
	        this.alertProcessing();
	        this.alarmNameType();
	      }
        $(window).on("resize",function(){
        	 _this.refer();
        })
      }
    });

