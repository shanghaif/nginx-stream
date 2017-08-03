

var trackPage = new Vue({
      template: "#app-trackWatch",
      el: '#trackWatch',
      data: {
        params:"",
        dataSpeed:false,
        carTeams:[],//车队的集合
        carArr:[],//车辆的集合
        selectedCar:"",//选中查看历史轨迹的车辆
        selectedCarId:"",//选中查看历史轨迹的车辆Id
        speedMax:180, //速度的阀值
        historyData:{},
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
        maxSpeedVal:20
      },
      methods: {
        shaixuan:function(){
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
         this.startDate = $startDate;
         this.endDate = $endDate;
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
                         for(var i=0;i<res.list.length;i++){
                           _this.echartsData.time.push(res.list[i].time);
                           _this.echartsData.data.push(res.list[i].speed);
                         }

                         _this.dataSpeed = true;
                         Vue.nextTick(function(){
                           _this.goSpeed();
                           $(".loaderContainer").hide();  //loading动画隐藏
                         })
                        // _this.historyData.maxSpeed = 20;

                       }else{
                       	 $(".loaderContainer").hide();  //loading动画隐藏
                         webComm.alertComponent("网络缓慢");
                       }

                    },
                    errorback:function(res){
                      $(".loaderContainer").hide();  //loading动画隐藏
                      webComm.alertComponent("网络缓慢");
                    }
                });
        },
        goSpeed:function(){ //超速分析页面
          var _this = this;
          var $value = 50;
          var option1;
          option1= {
            xAxis : [
                    {
                        type : 'category',
                        boundaryGap:false,
                        data : _this.echartsData.time,
                        axisLine: {
                            show: false
                        },
                        axisTick: {
                            show: false
                        },
                        axisLabel:{
                          show:false,
                          // rotate:-90,
                          fontSize:10
                        }
                    }
                ],
                grid: [ // 控制图的大小，调整下面这些值就可以，
                    {x: '30%', y: '8%', width: '65%', height: '65%'}
                ],
              // 	grid: {
              //           x: 800,
              //           x2: 200,
              // 					y:300,
              //           y2: 10// y2可以控制 X轴跟Zoom控件之间的间隔，避免以为倾斜后造成 label重叠到zoom上
              //  },
                yAxis : [
                    {
                        // type : 'value',
                        axisLine: {
                            show: false
                        },
                        axisTick: {
                            show: false
                        },
                        axisLabel: {
                            formatter: '{value} km/h'
                        }
                    }
                ],
                series : [
                    {
                        name:'超速分析',
                        type:'line',
                        animation:false,
                        smooth: true,
                        data:_this.echartsData.data,
                        showSymbol: false,
                          //2.0 定直线
                        markLine : {
                           smooth:true,
                           data :[ {yAxis: $value}], //分割线的Y值
                          symbol: ['none', 'none'],   //分割线的初始和结束位置处的icon
                          label:{
                            normal:{
                              show:false
                            },
                            emphasis:{
                              show:false
                            }
                          },
                           lineStyle:{
                             normal:{
                               color:"#3ec694",
                               type:'solid',
                               width:1
                             }
                           }
                        },
                        itemStyle: {
                          normal: {
                              lineStyle: {
                                  color: '#30a0e5',
                                  width:3
                              }
                          }
                      }
                    }
                ]
          }
          setTimeout(function(){
             _this.echartsShow(option1);//渲染折线图
          },100);
          $('#ex1').slider({
              step: 5,
              formatter: function(value) {
                _this.data1 = value;
                if(value!=$value){
                  $value = value;
                  option1.series[0].markLine.data[0].yAxis = value;
                  setTimeout(function(){
                     _this.echartsShow(option1);//渲染折线图
                  },100);
                }
                // return value;
              }
          });
        },
        echartsShow:function(option){ //渲染折线图
          $(".echartsBoxs").css({"width":'100%',"height":'auto'});
          $("#limit-analyse").css({"width":'100%',"height":'9rem','padding':"0","marginTop":"-1rem"});
           $("#echarts2").css({"width":'100%',"height":'9rem'});
          var myChart = echarts.init(document.getElementById('echarts2'));
          myChart.setOption(option);
        }
      },
      mounted: function() {
        this.params = window.localStorage.getItem("username");
        this.startSearch();
      }
    });
