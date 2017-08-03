

var trackPage = new Vue({
      template: "#app-trackWatch",
      el: '#trackWatch',
      data: {
        params:"",
        viewPages:true,
        defaultShow:false,
        filterBtn:false,  //顶部筛选按钮
        rightContent:true, //筛选页面
        rightCarBox:true, //筛选的车队页面
        rightCarList:false,  //筛选的车辆列表页面
        rightSpeed:false, //超速分析页面
        searchPages:false, //搜索页面
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
            console.log(this.selectArr);
           $(".search-con").html(str);
            }else{
              $('.search-con li').hide();
            }
        }
      },
      methods: {
        showCarLists:function(id){ //显示车辆列表
          var _this = this;
          var _url = "queryCars.jsp?"+this.params+"&teamId="+id;
          webComm.AS.baseRequest(_url,{
                    data: {},
                    callback: function(res) {
                       res = JSON.parse(res);
                       _this.carArr = res;
                       console.log(res);
                    },
                    errorback:function(res){
                      console.log(res);
                    }
                });
          this.rightCarBox=false;
        	this.rightCarList = true;
        },
        turnSearch:function(){//搜索跳转搜索页
          this.searchCarList();
          this.viewPages = false;
          this.searchPages = true;
        },
        searchResult:function(item){ //搜索结果的点击事件
          this.selectedCar=item.plate;
          this.selectedCarId = item.id;
          this.searchPages = false;
          this.viewPages = true;
        },
        cancelSearch:function(){//搜索结果的取消事件
          this.selectArr = [];
          this.vauleInput = '';
          this.searchPages = false;
          this.viewPages = true;
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
                             console.log(res);
                           }
                       });
        },
        sureCarList:function(){ //车辆列表页面确认按钮
          $(".watch-right-top .watch-right-top-top").find("b").removeClass("show").addClass("hide");
          $(".watch-right-ul").hide();
          this.rightCarList=false;
          this.rightCarBox = true;

        },
        resetCarList:function(){ //车辆列表页面重置按钮
          this.selectedCar="";
          this.selectedCarId = "";
        },
        startSearch:function(){ //开始查询历史轨迹
          var $startDate = $("#startDate").val();
          var $endDate = $("#endDate").val();
          if(this.selectedCarId == ""){
              webComm.alertComponent("请选择车辆");
              return false;
          };
          if($startDate==''||$endDate==''){
              webComm.alertComponent("请选择时间");
             return false;
          };
          $startDate = webComm.transDate($startDate).toString();
          $endDate = webComm.transDate($endDate).toString();
          this.startDate = $startDate;
          this.endDate = $endDate;
          var start1 = null;
          var end1 = null;
          var _startDate = null;
          var _endDate = null;
          start1 = $startDate.replace('-','/');
          start1 = start1.replace('-','/');
          end1 = $endDate.replace('-','/');
          end1 = end1.replace('-','/');
          _startDate = new Date(start1).getTime();
          _endDate = new Date(end1).getTime();
          if(_startDate>=_endDate){
            webComm.alertComponent("开始时间不允许大于结束时间");
            return false;
          };
          if(_endDate-_startDate>86400000){
            webComm.alertComponent("请选择时间间隔为一天内");
            return false;
          };
          var str1 = this.selectedCarId+'&&'+_startDate+'&&'+_endDate;
          window.localStorage.setItem("trackmap1",str1);
          window.location.href= "track-map.html";
          //---------------------------------------------------------------------------------------------
        },
        resetSearch:function(){ //重置搜索条件
          $("#startDate").val('');
          $("#endDate").val('');
          this.selectedCar="";
          this.selectedCarId = "";
        },
        showData:function(){ //初次加载数据
          var _this = this;
          var _url = "queryTeams.jsp?"+this.params;
          webComm.AS.baseRequest(_url,{
                    data: {},
                    callback: function(res) {
                       res = JSON.parse(res);
                       _this.carTeams = res;
                    },
                    errorback:function(res){
                      console.log(res);
                    }
                });
        },
        selectCar:function(plate,id){ //选中车辆
          this.selectedCar=plate;
          this.selectedCarId = id;
        }
      },
      mounted: function() {
      	var _this = this;
        this.params = window.localStorage.getItem("username");
        var isreturn = window.localStorage.getItem("isReturn"); //判断是否从实时监控跳转过来的
        if(isreturn==1){
          window.localStorage.setItem("isReturn",0);
          var carNameId = window.localStorage.getItem("historynameid"); // 从实时监控页面传的carId
          var arr = carNameId.split("&");
          this.selectedCar=arr[0];
          this.selectedCarId =arr[1];
        }
        // this.echartsShow();

        if (this.params == null) {
            window.localStorage.setItem("goPages",'track-details');
            window.location.href="index.html?1"
        }else{
          this.showData();
        }
      }
    });

$(function(){


      //筛选页面 车辆的选中和取消选中
    	$(document).on("touchstart",".filter-ul-lists li",function(){
    		if(!$(this).hasClass("active")){
    			$(this).addClass("active").siblings().removeClass("active");
    		}
    	});
    	//右侧覆盖层中的切换
			  $(".watch-right-top .watch-right-top-top").on("click",function(){ //显示隐藏车队
			     var isHide = $(this).find("b").hasClass("hide");
			     if(isHide){
			         $(this).find("b").removeClass("hide").addClass("show");
			         $(".watch-right-ul").show();
			         return false;
			     }else{
			        $(this).find("b").removeClass("show").addClass("hide");
			        $(".watch-right-ul").hide();
			        return false;
			     }
			  })
        //选中车辆的重置按钮
        $(document).on("touchstart",".filter-bottom-btn",function(){
           $(".filter-ul-lists li").each(function(){
             $(this).removeClass("active");
           })
        })

})
