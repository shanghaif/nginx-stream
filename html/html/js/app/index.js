$(function(){
  //右侧覆盖层中的切换
  $(".watch-right-top").on("click",function(){ //显示隐藏车队
     var isHide = $(this).find("b").hasClass("hide");
     if(isHide){
         $(this).find("b").removeClass("hide").addClass("show");
         $(".watch-right-ul").show();
         $(".watch-right-bottom").show();
         return false;
     }else{
        $(this).find("b").removeClass("show").addClass("hide");
        $(".watch-right-ul").hide();
        $(".watch-right-bottom").hide();
        return false;
     }
  })
  $(".watch-right-ul li").on("click",".watch-right-ul-list-top i",function(){ //点击车队的全选
       var _listCars = $(this).closest("li").find(".watch-right-ul-list-bottom").children("p");
       if($(this).hasClass("icon-gouxuan1")){ //全选
          $(this).removeClass("icon-gouxuan1").addClass("icon-gouxuan");
          _listCars.each(function(){
            $(this).attr("class","active");
          })
          return false;
       }else{  //全不选
         $(this).removeClass("icon-gouxuan").addClass("icon-gouxuan1");
         _listCars.each(function(){
           $(this).attr("class","");
         })
         return false;
       }
  })
  .on("click",".watch-right-ul-list-top",function(){ //点击车队的下拉展开或上拉收起
    var isHide = $(this).find("b").hasClass("hide");
    if(isHide){
        $(this).find("b").removeClass("hide").addClass("show");
        $(this).siblings(".watch-right-ul-list-bottom").css("display","flex");
        return false;
    }else{
       $(this).find("b").removeClass("show").addClass("hide");
       $(this).siblings(".watch-right-ul-list-bottom").css("display","none");
       return false;
    }
  })
  .on("click",".watch-right-ul-list-bottom p",function(){ //选择车队中的车辆
    if(!$(this).hasClass("active")){
        $(this).addClass("active");
        allSelect(1,$(this));
        return false;
    }else{
       $(this).removeClass("active");
       allSelect(0,$(this));
       return false;
    }
  });

  function allSelect(type,_this){ //车队全选 和 该车队中单选车辆的控制 , type=1判断是否全选 type=0判断是否不全选
     var _parent =  _this.parent(".watch-right-ul-list-bottom");
     var _topI = _parent.closest("li").find(".watch-right-ul-list-top").find("i");
     var _arrP = _parent.children('p');
     var flag = true;
     if(type==0){
       if(_topI.hasClass("icon-gouxuan")){
         _arrP.each(function(){
            if($(this).hasClass("active")){
               flag = false;
               return false;
            }
         })
         if(flag){
           _topI.removeClass("icon-gouxuan").addClass("icon-gouxuan1");
         }
       }
     }else{
       if(_topI.hasClass("icon-gouxuan1")){
         _arrP.each(function(){
            if(!$(this).hasClass("active")){
               flag = false;
               return false;
            }
         })
         if(flag){
           _topI.removeClass("icon-gouxuan1").addClass("icon-gouxuan");
         }
       }
     }

  }

})
