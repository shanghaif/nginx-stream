
var personCenter = new Vue({
      template: "#app-formResult2",
      el: '#formResult',
      data: {
        index:0,
        echarts1:true,
        echarts2:false,
        DataName:[],//echarts名字
        DataNum:[],//echarts数字
        Max:[],//折线图最大
        Data:[],
        teaminfo:[],//接口获取车队数据
        carsShow:[],//车辆数据
        carstype:[],
        allNum:0,
          color:['#c53030','#ec6060','#f29567','#f6cc5a','#bbe27d','#87d17d','#74cbb8','#5ab09d','#5a9db0','#559ac6','#4f7dc9','#2faeff','#2999e1','#4f7dc9','#2e64bc','#786cd3','#9c6cd3','#c86cd3','#e16890']//饼状图颜色
      },
      watch:{
        index:function(newVal,oldVal){
           if(newVal==0){
             this.echarts2 = false;
             this.echarts1 = true;
             this.lineEcharts(this.DataNum,this.Max,this.carstype);
           }else{
             this.echarts1 = false;
             this.echarts2 = true;
             this.pieEcharts(this.DataName,this.carstype);
           }
        }
      },
      methods:{
        returnEcharts:function(){
           if(this.index==0){
             this.index = 1;
           }else{
             this.index = 0;
           }
        },
        dataShow:function(){//最初数据渲染
         this.carsShow = window.localStorage.getItem("carsInfo");
          var arr =  this.carsShow.split("&");
          arr[1] = arr[1].replace('/','-');
          arr[1] = arr[1].replace('/','-');
          arr[2] = arr[2].replace('/','-');
          arr[2] = arr[2].replace('/','-');
            var _this = this;
            var _url = "queryRptTeamAlarmChart.jsp?"+_this.params;
            var data = {
                 teamId:arr[0],
                 stime:arr[1],
                 etime:arr[2],
                 alarmTypes:arr[3]
            }
            // _this.color = webComm.randomColor(arr[3]);

            webComm.loadingShow(); //loading动画显示
            webComm.AS.baseRequest(_url,{
                      data: data,
                      callback: function(res) {
                         res = JSON.parse(res);
                         $(".loaderContainer").hide();  //loading动画隐藏
                        _this.teaminfo= res;

                        var arr = [];
                        for( var m in _this.teaminfo){
                            var carType = {};
                            carType.name=m;
                            carType.value = _this.teaminfo[m];
                            _this.carstype.push(carType)
                            _this.DataName.push(m);
                            arr.push(_this.teaminfo[m]);
                             _this.allNum+=_this.teaminfo[m];
                         }
                         var val = Math.max.apply(null,arr);
                         for(var i=0;i<arr.length;i++){
                            _this.Max.push(val);
                         }
                         for (var i = 0; i < _this.DataName.length; i++) {
                            
                            _this.DataNum.push(i);
                          };


                        _this.lineEcharts(_this.DataNum,_this.Max,_this.carstype);
                        //_this.pieEcharts(_this.DataName,_this.carstype);


                      },
                      errorback:function(res){
                        $(".loaderContainer").hide();  //loading动画隐藏
                        webComm.alertComponent("网络缓慢");
                      }
                  });
        },
        lineEcharts:function(DataName,Max,Data){ //渲染折线图
          var myChart1 = echarts.init(document.getElementById('echart1'));
          var option1 = {
              color: ['#31a3e9'],
              tooltip : {
                  show:false
                  //trigger: 'ayis',
                  //axisPointer : {            // 坐标轴指示器，坐标轴触发有效
                      // type : 'shadow'        // 默认为直线，可选为：'line' | 'shadow'
                  //}
              },
              calculable : true,
              grid: {
                  top:'8%',
                  left: '3%',
                  right: '4%',
                  bottom: '20%',
                  containLabel: true
              },
              xAxis : [
                  {
                      type : 'category',
                      axisLabel:{    //坐标轴刻度标签
                        textStyle:{
                          color:'#55688d'
                        },
                        margin:6,
                        rotate: -45
                      },
                      data :DataName,//X轴名称
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
                show:true,
                axisLine:{
                  show:false
                },
                axisTick:{
                  show:false
                },
                axisLabel:{
                  show:true,
                  textStyle:{
                    color:'#55688d'
                  }
                },
                splitLine:{
                  interval:3,
                  lineStyle:{
                    color:"#e7e7e7",
                    type:'dashed'
                  }
                }
              },
               series: [
                  { // For shadow
                      type: 'bar',
                      itemStyle: {
                          normal: {color: '#dee5ea' }//背景阴影的颜色
                      },
                      barGap:'-100%',
                      barCategoryGap:'40%',
                      data: Max,
                       barMaxWidth: '22px',
                      animation: false
                  },
                  {
                      type: 'bar',
                       barMaxWidth: '22px',
                      itemStyle: {//图形的样式
                          normal: {
                              color:'#aac1d6', //柱条的颜色。 默认从全局调色盘 option.color 获取颜色。
                          },
                          emphasis: {
                              color:'#31a3e9' //柱条的颜色。柱条在高亮状态下的样式，比如在鼠标悬浮或者图例联动高亮时。
                          }
                      },
                      data: Data//数据
                  }
              ]
          };
          // 使用刚指定的配置项和数据显示图表。

          myChart1.setOption(option1);
        },
        pieEcharts:function(DataName,Data){ //渲染饼状图
          var myChart2 = echarts.init(document.getElementById('echart2'));
          var option2 = {
                grid: {
                    top:'10px',
                    left: '10px',
                    right: '10px',
                    bottom: '10px',
                    containLabel: true
                },

                color:this.color, //扇形顺时针依次的颜色
                legend: {
                    show: false,
                    orient: 'vertical',
                    x: 'left', //图例组件水平排布方式
                    left:'20', //图例组件离容器左侧的距离
                    top:300,
                    itemWidth:14,
                    itemHeight:14,
                    itemGap:18, //图例每项之间的间隔
                    textStyle:{ //图例的公用文本样式
                      color:'#55688d',
                      fontSize:16
                    },
                    data: DataName,
                    formatter:function(name){
                    	var oa = option2.series[0].data;
                    	var num = 0;
                      for(var i = 0; i < oa.length; i++){
                           num += oa[i].value;
                    	}
                    	for(var m = 0; m < oa.length; m++){
                               if(name==oa[m].name){
                               	return '   '+name + '          ' + (oa[m].value/num * 100).toFixed(2) + '%';
                               }
                    	}
                   },
                   tooltip: {
                      show: true
                  }
                },
                series : [
                    {
                        name: '报警统计',
                        selectedOffset:15,
                        type: 'pie',
                        radius : '90%',
                        center: ['50%', '50%'],
                        data:Data,
                        itemStyle: {
                            emphasis: {
                                shadowBlur: 10,
                                shadowOffsetX: 0,
                                shadowColor: 'rgba(0, 0, 0, 0.5)'
                            }
                        },
                        itemStyle: {
                            normal: {
                                label:{
                                       show: false,
                                       formatter: '{b} : {c} ({d}%)'
                                   }
                            },
                               labelLine :{show:true}
                        }
                    }
                ]
          }

          myChart2.setOption(option2);
         //  myChart2.on('click', function (param) {
         //     var index = param.dataIndex;
         // }); 

        }
      },
      mounted:function(){
        this.params = window.localStorage.getItem("username");
        this.dataShow();
      }
    })
 
