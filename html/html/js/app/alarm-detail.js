
var watchPage = new Vue({
      template: "#app-alarmDetail",
      el: '#alarmDetail',
      data: {
        params:'',//本地缓存params
        isWorked:0, //已处理
        data1:[], //警报的车辆列表
        count1:0,
        data2:[], //报警类型
        defaultShow:true,
        rightContent:false, //筛选页面
        warnPage:true, //报警页面
        warnTypeHide:false,  //筛选报警类型页面
        filerCarlists:false, //车辆列表页面
        carsId:[], // 选中的报警类型
        cars:[] //选中的车辆ids
      },
      methods: {
        warnDetail:function(data){ //点击报警车辆进入报警详情页
          var str = '';
          for(var i in data){
            str+=i+"&"+data[i]+"&&";
          }
          console.log(str);
          window.localStorage.setItem("carWarnWatch",str);
          window.location.href="warnDetail.html";
        },
        showCarsList:function(id){ //跳转车辆列表页面
          this.warnPage=false;
          this.warnTypeHide=false;
        	this.filerCarlists = true;
        },
        selectCarType:function(index,id){ //选择车辆类型
          var _ids = this.carsId;
          if(_ids.indexOf(id)==-1){
            _ids.push(id);
          }else{
            for(var m=0;m<_ids.length;m++){
               if(_ids[m]==id){
                  _ids.splice(m,1);
                  return false;
               }
            }
          }
        },
        loadWarn:function(val){
          var _this = this;
          _this.count1 = 0;
          var _url = '';
          if(_this.isWorked==0){ //判断是否已处理列表 还是 未处理列表
            _url = "queryRealAlarm.jsp?"+this.params;
          }else{
            _url = "queryHisAlarm.jsp?"+this.params;
          }
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
                            res[i].picUrl = 'http://115.233.219.190:1680/'+res[i].picUrl;
                          }
                          if(res[i].vidUrl!=''){
                            res[i].vidUrl = 'http://115.233.219.190:1680/'+res[i].vidUrl;
                          }
                        }
                        _this.data1 = res;
                      }else{

                      }

                    },
                    errorback:function(res){
                      console.log(res);
                    }
                });
        }
      },
      mounted: function() {
        this.params = window.localStorage.getItem("username");
         if (this.params == null) {
            window.localStorage.setItem("goPages",'alarm-detail');
            window.location.href="index.html?1"
        }else{
        webComm.loadingShow(); //loading动画显示
        this.loadWarn('');
      }
      }
    });
