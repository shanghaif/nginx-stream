

var addrEnd = new Vue({
      template: "#app-addrEnd",
      el: '#addrEnd',
      items:{},
      data: {
        params:'',
        viewPage:true,
        filterPage:false,
        comTypes:[],  // 常用类型
        overdue:[], // 过期提醒
        searchType:'CAR', //查询类型
        remindTypes:'', //提示类型
        dayNum:30,
        swichIndex:0, //车辆和司机切换
        expireNum:'', // 天数
        typeId:[], //提示类型
        typeid:'' //提示类型id
      },
      watch:{

      },
      methods:{
        showFilter:function(){
          this.viewPage = false;
          this.filterPage = true;
          this.swich();
        },
        expire:function(){//一开始页面数据渲染
          var _url = "queryExpireData.jsp?"+this.params+"&searchType="+this.searchType+"&remindTypes="+this.remindTypes+"&dayNum="+this.dayNum;
          var _this = this;
          webComm.AS.baseRequest(_url,{
               data: {},
               callback: function(res) {
                console.log(res)
                  res = JSON.parse(res);
                  _this.overdue = res;
               },
               errorback:function(res){
                      webComm.alertComponent("网络缓慢");
                //  console.log(res);
               }
           });
        },
        swich:function(){  //默认车辆
          var _url = "queryCommonType.jsp?"+this.params+"&types=CAR";
          var _this = this;
          webComm.AS.baseRequest(_url,{
               data: {},
               callback: function(res) {
                console.log(res)
                  res = JSON.parse(res);
                  _this.comTypes = res;
               },
               errorback:function(res){
                //  console.log(res);
               }
           });
        },
        swichIndex0:function(){ //车辆
          this.swichIndex = 0;
          var _url = "queryCommonType.jsp?"+this.params+"&types=CAR";
          var _this = this;
          webComm.AS.baseRequest(_url,{
               data: {},
               callback: function(res) {
                console.log(res)
                  res = JSON.parse(res);
                  _this.comTypes = res;
                  _this.typeId=[];
               },
               errorback:function(res){
                //  console.log(res);
               }
           });
        },
        swichIndex1:function(){   //司机
          this.swichIndex = 1;
          var _url = "queryCommonType.jsp?"+this.params+"&types=DRV";
          var _this = this;
          webComm.AS.baseRequest(_url,{
               data: {},
               callback: function(res) {
                console.log(res)
                  res = JSON.parse(res);
                  _this.comTypes = res;
                  _this.typeId=[];
                  
               },
               errorback:function(res){
                //  console.log(res);
               }
           });
        },
        sureSelected:function(){  //确定
          this.viewPage = true;
          this.filterPage = false;

          var _this = this,
              _url = '';
          for (var i = 0; i < _this.typeId.length; i++) {
            _this.typeid = _this.typeid+_this.typeId[i]+',';
          };
          _this.typeid =_this.typeid.substring(0,_this.typeid.length-1);//_this.alarmId就是被去掉了最后一个逗号的字符串
          _this.remindTypes = _this.typeid;
          _this.dayNum = _this.expireNum;

          if (_this.swichIndex == 0) {
            _this.searchType = 'CAR';
          }else if (_this.swichIndex == 1) {
            _this.searchType = 'DRV';
          };

          var _url = "queryExpireData.jsp?"+this.params+"&searchType="+this.searchType+"&remindTypes="+this.remindTypes+"&dayNum="+this.dayNum;
          webComm.AS.baseRequest(_url,{
               data: {},
               callback: function(res) {
                console.log(res)
                  res = JSON.parse(res);
                  _this.overdue = res;
               },
               errorback:function(res){
                      webComm.alertComponent("网络缓慢");
                //  console.log(res);
               }
           });

          _this.typeId=[];
          _this.expireNum = '';
          _this.swichIndex = 0;   //点击确定了回到默认的“车辆”
        },
        reset:function(){ //重置
          this.typeId=[];
          this.expireNum = '';
        },
        selectType:function(index,id){ //选择类型
          if(this.typeId.indexOf(id)==-1){
            this.typeId.push(id);
            console.log(this.typeId);
            if(this.typeId.length==this.comTypes.length) {
              this.typeId.push('all');
            };
          }else{
            for(var m=0;m<this.typeId.length;m++){
               if(this.typeId[m]==id){
                  this.typeId.splice(m,1);
                  // console.log("all");
                  if (this.typeId.length==this.comTypes.length) {
                    for (var i = 0; i < this.typeId.length; i++) {
                      if (this.typeId[i]=='all') {
                        // console.log("alls");
                        this.typeId.splice(i,1);
                      };
                    };
                  };
                  return false;
               }
            }
          }          
        },
        selectAll:function(){//全选
          // console.log(this.comTypes.length)
          if (this.typeId.indexOf('all')>-1) {
            this.typeId=[];
            console.log(this.typeId);
          }else{
            this.typeId=[];
            for (var i = 0; i < this.comTypes.length; i++) {
              this.typeId.push(this.comTypes[i].id);
            };
            this.typeId.push('all');
          };
          console.log(this.typeId);
        }
      },
      mounted:function(){
        this.params = window.localStorage.getItem("username");
        if (this.params == null) {
            window.localStorage.setItem("goPages",'addrEnd');
            window.location.href="index.html?1"
        }else{
          this.expire();
        }
      }

    });

    $(function(){

    	//右侧覆盖层中的切换
    			  $(document).on('touchstart', '.watch-right-top .watch-right-top-top', function(event) { //显示隐藏车队
    			     var isHide = $(this).find("b").hasClass("hide");
    			     if(isHide){
    			         $(this).find("b").removeClass("hide").addClass("show");
    			         $(".addrEndBottom-ul").css("display","flex");
    			         return false;
    			     }else{
    			        $(this).find("b").removeClass("show").addClass("hide");
    			        $(".addrEndBottom-ul").css("display","none");
    			        return false;
    			     }
    			  })

    })
