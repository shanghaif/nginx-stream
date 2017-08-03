
var personCenter = new Vue({
      template: "#app-personCenter",
      el: '#personCenter',
      data: {},
      methods:{
        getOut:function(){
        	  var userInfo = window.localStorage.getItem("remberpasswordjw");
            localStorage.clear();
            window.localStorage.setItem("remberpasswordjw",userInfo);
            window.location.href="index.html";
        }
      },
      mounted:function(){
        this.params = window.localStorage.getItem("username");
      }
    })
