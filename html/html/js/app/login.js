define([], function() {
  var login = new Vue({
        template:"#app-login",
        el: '#login',
        data: {
          name:"",
          password:"",
          tishi1:"",
          tishi2:"",
          showTishi1:false,
          showTishi2:false,
          isRember:true
        },
        methods: {
          login:function(){
            var _this = this;
            if(this.name!=''&&this.password!=''){
              var hash = hex_md5(_this.password);
               var data = {
                           "userId":_this.name,
                           "password":hash,
                           "loginWay":"wx",
                           "loginType":'user'
                         };
               webComm.AS.baseRequest("login.jsp",{
                           data: data,
                           callback: function(res) {                              
                              _this.tishi = res;
                              res = JSON.parse(res);
//                            console.log(res);
                              // console.log(res.state)
                              //成功后跳转
                              if (res.state=='ok') {
                              	//判断是否保存密码
                              	if(_this.isRember){
                              		var _time = new Date().getTime();
                              		var str = _this.name+"&&&"+_this.password+"&&&"+_time;
                              		window.localStorage.setItem("remberpasswordjw",str);
                              	}else{
                              		window.localStorage.setItem("remberpasswordjw",'');
                              	}
                              	
                                var _sessionId = res.sessionId;
                                var params= "sessionId="+_sessionId+"&userId="+_this.name+"&loginWay=wx&loginType=user";
                                window.localStorage.setItem("username",params);
                               var $page = window.localStorage.getItem("goPages");
                              var $url = window.location.href;
                                if ($url.indexOf('?')>-1) {
                                 window.location.href= $page+".html";
                                }else{
                                 window.location.href= "real-time.html";
                                };
                              };
                              //用户不存在
                              if (res.state=='user error') {
                                _this.showTishi1 = true;
                                _this.tishi1 = "用户不存在";
                              };
                              //密码不正确
                              if (res.state=='pwd error') {
                                _this.showTishi2 = true;
                                _this.tishi2 = "密码不正确";
                              };
                           },
                           errorback:function(res){
                             console.log(res);
                           }
                       });
             }
             //判断是否为空
             if(this.name==""){
                _this.showTishi1 = true;
                _this.tishi1 = "请输入用户名";
             }else{
              _this.showTishi1 = false;
             };

             if(this.password==""){
                _this.showTishi2 = true;
                 _this.tishi2 = "请输入密码";
             }else{
              _this.showTishi2 = false;
             };

          },
          isRemberPsd:function(){ //是否保持密码
          	 if(this.isRember){
          	 	 this.isRember = false;
          	 }else{
          	 	 this.isRember = true;
          	 }
          }
        },
        mounted: function() {
        	var str = window.localStorage.getItem("remberpasswordjw");
        	if(str!=null&&str!=undefined){
        		var arrInfo = str.split("&&&");
	        	var _time = new Date().getTime();
	        	if(_time-arrInfo[2]>=2592000000){ //保存账号和密码过期
	        		window.localStorage.setItem("remberpasswordjw",'');
	        		arrInfo = [];
	        	}
	        	this.name = arrInfo[0];
	        	this.password = arrInfo[1];
        	}
        	
          // this.login();
        }
      })
})


var clientHeight = document.body.clientHeight;
    var _focusElem = null; //输入框焦点
    //利用捕获事件监听输入框等focus动作
    document.body.addEventListener("focus", function(e) {
        _focusElem = e.target || e.srcElement;
    }, true);
    //因为存在软键盘显示而屏幕大小还没被改变，所以以窗体（屏幕显示）大小改变为准
    window.addEventListener("resize", function() {
        if (_focusElem && document.body.clientHeight < clientHeight) {
            //焦点元素滚动到可视范围的底部(false为底部)
            _focusElem.scrollIntoView(false);
        }
    });