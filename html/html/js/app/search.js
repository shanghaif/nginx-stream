
var watchPage = new Vue({
      template: "#app-searchPage",
      el: '#searchPage',
      data: {
        params:'',
        items:[],
        selectArr:[],
        vauleInput:'',
        idValue:''
      },
      watch:{
        vauleInput:function(newVal,oldVal){
            if($('.searchInput').val()!=''){
            var str = '';
            for (var i = 0; i < this.items.length; i++) {
              var changeIndex= this.items[i].plate.indexOf(newVal);

                if (changeIndex!=-1) {
                  this.selectArr.push(this.items[i]);
                };
            };
            // console.log(str);
           $(".search-con").html(str);
            }else{
              $('.search-con li').hide();
            }
        }
      },
      methods: {
        searchCarList: function(id){//车队下车辆信息
          var _url = "queryCars.jsp?"+this.params;
          var _this = this;
          webComm.AS.baseRequest(_url,{
                           data: {},
                           callback: function(res) {
                              res = JSON.parse(res);
                              console.log(res);
                              _this.items=res;
                           },
                           errorback:function(res){
                             console.log(res);
                           }
                       });
        },
        setlocalStorage:function(item){
          var str = '';
          for(var i in item){
            str+=i+"&"+item[i]+"&&";
          }
          console.log(str);
          window.localStorage.setItem("searchInfo1",str);
          // window.location.href="warnDetail.html";
          // console.log(searchInfo)
        }
      },
      mounted: function() {
        this.params = window.localStorage.getItem("username");
        if (this.params == null) {
            window.localStorage.setItem("goPages",'search');
            window.location.href="index.html?1"
        }else{
        // console.log(this.params);
        this.searchCarList();
      }
      }
    });
