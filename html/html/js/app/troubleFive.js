var troubleFive = new Vue({
      template: "#app-troubleFive",
      el: '#troubleFive',
      data: {
        items:{},
        dataName:['无定位', '3天无定位', '3天有定位无速度', '3天有速度无报警'],
        faultMax:[],  //最大值
        faultData:[],
        dataArr:[]
      },
      methods:{
        getGps:function(){
          var _this = this;
          var _url = "queryExceptionData.jsp?"+this.params;
          webComm.AS.baseRequest(_url,{
                    data: {},
                    callback: function(res) {
                      console.log(res);
                      res = JSON.parse(res);
                       _this.items = res;
                       _this.dataArr=[
                       {'name':'无定位','data':res.no_gps},
                       {'name':'3天无定位','data':res.day3_no_gps},
                       {'name':'3天有定位无速度','data':res.day3_no_speed},
                       {'name':'3天有速度无报警','data':res.day3_no_alarm}];
                       var dataMax = res.no_gps+res.day3_no_gps+res.day3_no_speed+res.day3_no_alarm;
                       _this.faultMax = [dataMax,dataMax,dataMax,dataMax];
                       _this.faultData = [res.no_gps,res.day3_no_gps,res.day3_no_speed,res.day3_no_alarm];
                       _this.Echarts(_this.dataName,_this.faultData,_this.faultMax);
                    },
                    errorback:function(res){
                      console.log(res);
                    }
                });
        },
        Echarts:function(dataName,faultData,faultMax){
          var myChart = echarts.init(document.getElementById('echart1'));
          option = {
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
                  left: '3%',
                  right: '4%',
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
                        interval:0,
                        formatter: function (value, index) {
                          value = value.substring(0,5)+"\n"+value.substring(5);
                          return value;
                        }
                      },
                      data : dataName,
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
                      data: faultMax //此处是最大值
                  },
                  {
                      type:'bar',
                      name:'',
                      barWidth: '22px',
                      data:faultData,
                      markPoint : {
                        silent:true,
                        data : faultData,
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
          myChart.setOption(option);
        }
      },
      mounted:function(){
        this.params = window.localStorage.getItem("username");
        if (this.params == null) {
            window.localStorage.setItem("goPages",'addrEnd');
            window.location.href="index.html?1"
        }else{
          this.getGps();
        }
        
      }
    })

$(function(){
  
})
