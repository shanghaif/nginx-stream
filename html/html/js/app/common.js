/**
 * common
 * 全局变量/方法定义
 **/
if (typeof webComm == 'undefined') {
    var webComm = {};
    webComm = {
        /**
         * @function cookie
         * @returns cookie function obj
         */
        cookie: {
            set: function(cname, cvalue, exdays) { //设置cookie
                alert(cname);
                this.clear(cname);
                var d = new Date();
                d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
                var expires = "expires=" + d.toUTCString();
                document.cookie = cname + "=" + cvalue + "; " + expires + "; path=/; domain=" + document.domain;
            },
            get: function(cname) { //获取cookie
                var name = cname + "=";
                var ca = document.cookie.split(';');
                for (var i = 0; i < ca.length; i++) {
                    var c = ca[i];
                    while (c.charAt(0) == ' ') {
                        c = c.substring(1);
                    }
                    if (c.indexOf(name) != -1) {
                        return c.substring(name.length, c.length);
                    }
                }
                return "";
            },
            clear: function(cname) { //清除cookie
                var exp = new Date();
                exp.setTime(exp.getTime() - 1);
                var cval = this.get(cname);
                if (cval !== null) {
                    document.cookie = cname + "=" + cval + ";expires=" + exp.toGMTString();
                }
            }
        },
        /**
         * @function trim
         * @returns trim the string blank
         */
        trim: function(str) {
            var _this = this;
            if (_this.isUndefinedOrNull(str)) {
                return str;
            } else {
                return str.replace(/^\s+|\s+$/g, '');
            }
        },
        /**
         * @function parseURL
         * @param url,the window.location or a url string,use current domain url if don't pass the url;
         * @returns a object with source,protocol,port, query,params,hash;
         */
        parseURL: function(url) {
            var a = document.createElement('a');
            a.href = url;
            return {
                source: url,
                protocol: a.protocol.replace(':', ''),
                host: a.hostname,
                port: a.port,
                query: a.search,
                params: (function() {
                    var ret = {},
                        seg = a.search.replace(/^\?/, '').split('&'),
                        len = seg.length,
                        i = 0,
                        s;
                    for (; i < len; i++) {
                        if (!seg[i]) {
                            continue;
                        }
                        s = seg[i].split('=');
                        ret[s[0]] = s[1];
                    }
                    return ret;
                })(),
                hash: a.hash.replace('#', '')
            };
        },
        /**
         * @function checkHash
         * @returns the hash string in the url
         */
        checkHash: function() {
            try {
                //var r = window.location.href;
                //var i = r.indexOf("#");
                //return (i >= 0? r.substr(i+1): "");
                var data = location.hash ? location.hash.substring(1) : '';
                return data;
            } catch (e) {
                return null;
            };
        },
        alertComponent:function(aa){ //信息提示窗
          var str = '<div class="alertComponent">'+aa+'<div>';
          $("body").append(str);
          setTimeout(function(){
            $(".alertComponent").fadeOut();
          },2000);
        },
        transDate:function(date){ //将时间格式yyyy年m月d日 hh:ss 输出时间格式 yyyy-mm-dd hh:ss:mm
          date = date.replace("年",'/');
          date = date.replace("月",'/');
          date = date.replace("日",' ');
          date += ':00';
          var _data = new Date(date);
          var _y = parseInt(_data.getFullYear());
          var _mon = parseInt(_data.getMonth()+1);
          var _d = parseInt(_data.getDate());
          var _h = parseInt(_data.getHours());
          var _min = parseInt(_data.getMinutes());
          _mon = _mon<10?'0'+_mon:_mon;
          _d = _d<10?'0'+_d:_d;
          _h = _h<10?'0'+_h:_h;
          _min = _min<10?'0'+_min:_min;

          var str = (_y+'-'+_mon+'-'+_d+' '+_h+':'+_min+':00').toString();

          return str;
        },
        returnStr:function(arr){
          var str ="";
            for (var i = 0; i < arr.length; i++) {
              str += ','+arr[i];
            };
            str = str.substring(1);
            return str;
        },
        loadingShow:function(){ //loading组件
          var str = '<div class="loaderContainer"><div class="loader"><div class="line-spin-fade-loader"><div></div><div></div><div></div>';
		          str += '<div></div><div></div><div></div><div></div><div></div></div></div></div>';
              $("body").append(str);
        },
        randomColor:function(str){
            var color =[];
            var arr = str.split(",");
             for(var i=0;i<arr.length;i++){
                var r=Math.floor(Math.random()*256);
                var g=Math.floor(Math.random()*256);
                var b=Math.floor(Math.random()*256);
                color.push("rgb("+r+','+g+','+b+")")
             }

             return color;//所有方法的拼接都可以用ES6新特性`其他字符串{$变量名}`替换
         },
         unDouble:function(arr){ //json数组去重
         	 var newArr = [];
         	 for(var n=0;n<arr.length;n++){
         	 	for(var m=0;m<newArr.length;m++){
         	 		if(arr[n].id == newArr[m].id){
         	 			break;
         	 		}
         	 	}
         	 	if(m>=newArr.length){
         	 		newArr.push(arr[n]);
         	 	}
         	 }
         	 return newArr;
         },
        stated:function(num){ //根据数字获取对应的车辆状态
           switch(num){
             case '0' : return '离线-从未上线' ;
             case '1' : return '离线-未定位' ;
             case '2' : return '离线-未定位-报警' ;
             case '3' : return '离线-有定位' ;
             case '4' : return '离线-有定位-报警' ;
             case '5' : return '在线-未定位' ;
             case '6' : return '在线-未定位-报警' ;
             case '7' : return '在线-行驶' ;
             case '8' : return '在线-行驶-报警' ;
             case '9' : return '在线-停车' ;
             case '10' : return '在线-停车-报警' ;
           }
        },
        translateGps:function(map,points){ //
        	   // 创建地图实例
	         //_this.historyList = webComm.translateGps(map,_this.historyList); //gps坐标转换成百度坐标

	         var pointsArr = [], //把historyList中经纬度单独取出来，放置新数组。
	             transIndex = 0, //百度api限制每次转换10个，计数当前转换的次数
	             arrCurrent = [],
	             pointsArrNew = []; //转换完的经纬度
	         var times = Math.floor(_this.historyList.length/10); //倍数   一次最多10个点
	         //把historyList中经纬度单独取出来，放置新数组。
	          var arr = [];
							    	var json = {};
							    	for(var m=0;m<_this.historyList.length;m++){
							    		if(m%10==0 && m!=0){
							    			pointsArr.push(arr);
							    			arr = [];
							    		}
							    		json = {};
							    		json.lng = _this.historyList[m].lng;
							    		json.lat = _this.historyList[m].lat;
							    		arr.push(json);
							    	}
							    	if(m%10!=0 && m!=0){
							    		pointsArr.push(arr);
							    	}

	          var convertor = new BMap.Convertor();
	          function startSranslate(pointsCurrent){
	          	arrCurrent = [];
	          	for(var i=0;i<pointsCurrent.length;i++){
	          		 arrCurrent.push(new BMap.Point(pointsCurrent[i].lng,pointsCurrent[i].lat));
	          	}
	          	convertor.translate(arrCurrent, 1, 5, translateCallback);
	          }

	           translateCallback = function (data){
					      if(data.status === 0) {
					      	var points = data.result;
									for(var i=0;i<data.points.length;i++){
										pointsArrNew.push(data.points[i]);
									}
									transIndex++;
									if(transIndex<=times){ //还没转换全部，继续调用转换
										startSranslate(pointsArr[transIndex]);
									}else{
										//转换完成，把新取得的经纬度赋值到原来数据上
										for(var i=0;i<pointsArrNew.length;i++){
											_this.historyList[i].lng = pointsArrNew[i].lng;
											_this.historyList[i].lat = pointsArrNew[i].lat;
										}
										$(".loaderContainer").hide();  //loading动画隐藏
										_this.showMap(map);
									}
					      }
					    }
	            startSranslate(pointsArr[transIndex]); //首次转换
        }
    };
}
var appComm = {};
appComm.init = function () {

    var pageJs = $("body").attr("data-pageJs");
    if (typeof (pageJs) != 'undefined') {
        console.log('require success');
        require([pageJs]);
    }
}

/* 动态换算rem和px值  */
var rem =20;
var winHeight = $(window).width();   //获取当前页面高度
function changeW() {
	rem = 20 / 320 * document.documentElement.clientWidth;
    document.documentElement.style.fontSize = rem + "px";
    var thisHeight=$(this).width();
    if(thisHeight>winHeight){
    	if($(".ds768").hasClass("noneHide")){
			//$(".ds768").removeClass("noneHide")
		}
    	return false;
    }
	if($("#nameInput").is(":focus") || $("#psdInput").is(":focus")){
    $(".ds768").addClass("noneHide");
		return false;
	}
  if(!$("#nameInput").is(":focus") && !$("#psdInput").is(":focus")){
    $(".ds768").removeClass("noneHide");
		return false;
	}
	//判断横屏或者竖屏
	if(device.landscape()){ //横屏
		if($(".ds768").hasClass("noneHide")){
			$(".ds768").removeClass("noneHide")
		}
	}else{
		if(!$(".ds768").hasClass("noneHide")){
			$(".ds768").addClass("noneHide")
		}
	}

}
changeW();
window.addEventListener("resize", changeW, false);

	//获取用户名
	var getSession = window.localStorage.getItem("username");
	var userName = '';
	if(getSession!=null){
		var sessionId = getSession.split('&');
	    var session1 = sessionId[1];
	    userName = session1.split('=')[1];
	}

$(document).on('click', '.watch-left-top', function(event) {
      window.location="personCenter.html"
})

$(document).on('click', '.watch-left-bottom li:first', function(event) {
      window.location="real-time.html"
})
$(document).on('click', '.watch-left-bottom li:nth-child(2)', function(event) {
      window.location="warnWatch.html"
 })
$(document).on('click', '.watch-left-bottom li:nth-child(3)', function(event) {
      window.location="track-details.html"
 })
$(document).on('click', '.watch-left-bottom li:nth-child(4)', function(event) {
      window.location="notice.html"
 })
$(document).on('click', '.watch-left-bottom li:nth-child(5)', function(event) {
      window.location="troubleFive.html"
 })
$(document).on('click', '.watch-left-bottom li:nth-child(6)', function(event) {
      window.location="null.html"
 })
$(document).on('click', '.watch-left-bottom li:nth-child(7)', function(event) {
      window.location="addrEnd.html"
 })
$(document).on('click', '.watch-left-bottom li:nth-child(8)', function(event) {
      window.location="call-center.html"
 })
