$(function() {
    //开始日期的选择
     $(document).on("click",".start_date",function(){
        $("#picker-date-container").removeClass().addClass("pick001"); //class是为了区分，日历作用于哪个input。
        picker("startDate",0);
        return false;
     });
    //结束日期的选择
     $(document).on("click",".end_date",function(){
        $("#picker-date-container").removeClass().addClass("pick002"); //class是为了区分，日历作用于哪个input。
        picker("endDate",1);
        return false;
     });

     //开始日期的选择
     $(document).on("click",".teamstart_date",function(){
        $("#picker-date-container").removeClass().addClass("pick001"); //class是为了区分，日历作用于哪个input。
        picker("teamStartDate",2);
        return false;
     });
    //结束日期的选择
     $(document).on("click",".teamend_date",function(){
        $("#picker-date-container").removeClass().addClass("pick002"); //class是为了区分，日历作用于哪个input。
        picker("teamEndDate",3);
        return false;
     });

     //开始日期的选择
     $(document).on("click",".photostart_date",function(){
        $("#picker-date-container").removeClass().addClass("pick001"); //class是为了区分，日历作用于哪个input。
        picker("photoStartDate",0);
        return false;
     });
    //结束日期的选择
     $(document).on("click",".photoend_date",function(){
        $("#picker-date-container").removeClass().addClass("pick002"); //class是为了区分，日历作用于哪个input。
        picker("photoEndDate",1);
        return false;
     });

 });
      var myPicker = null;
      var myApp = new Framework7();
       //时间选择
       function picker(id,anyday){ //参数为 所要展示的input的id     anyday代表取哪一天 0昨天 1今天 2昨天0点 3昨天23点59分
         $(".pickerBg").show(0);
        //先清除选择器容器的其他日历。
        $("#picker-date-container").html("");
        var _id = '#'+id;        
        var _today = new Date();
        var _todayGetTime = _today.getTime()-86400000;
        var _yesterday = new Date(_todayGetTime);
        var _yesStart = new Date(_todayGetTime);
        var _yesEnd = new Date(_todayGetTime);
         _yesStart = new Date(_yesStart.setHours(0,0,0));
         _yesEnd = new Date(_yesEnd.setHours(23,59,59));
        var today = null;
        var cols = [
            // Years
                {
                    values: (function () {
                        var arr = [];
                        for (var i = 2005; i <= 2030; i++) { arr.push(i+"年"); }
                        return arr;
                    })()
                },
                // Months
                {
                    values: ('0 1 2 3 4 5 6 7 8 9 10 11').split(' '),
                    displayValues: ('1月 2月 3月 4月 5月 6月 7月 8月 9月 10月 11月 12月').split(' '),
                    textAlign: 'left'
                },
                // Days
                {
                    values:[1+"日",2+"日",3+"日",4+"日",5+"日",6+"日",7+"日",8+"日",9+"日",10+"日",11+"日",12+"日",13+"日",14+"日",15+"日",16+"日",17+"日",18+"日",19+"日",20+"日",21+"日",22+"日",23+"日",24+"日",25+"日",26+"日",27+"日",28+"日",29+"日",30+"日",31+"日"]
                },
                // Hours
                {
                    textAlign: 'center',
                    values: (function () {
                        var arr = [];
                        for (var i = 0; i <= 23; i++) { arr.push(i); }
                        return arr;
                    })()
                },
                // Divider
                {
                    divider: true,
                    content: ' : ',
                    textAlign: 'left'
                },
                // Minutes
                {
                    values: (function () {
                        var arr = [];
                        for (var i = 0; i <= 59; i++) { arr.push(i < 10 ? '0' + i : i); }
                        return arr;
                    })(),
                }
            ];
        if(anyday==0){
        	today = _yesterday;
        }else if(anyday==1){
        	today = _today;
        }else if(anyday==2){
        	today = _yesStart;
        	cols = [
            // Years
                {
                    values: (function () {
                        var arr = [];
                        for (var i = 2005; i <= 2030; i++) { arr.push(i+"年"); }
                        return arr;
                    })()
                },
                // Months
                {
                    values: ('0 1 2 3 4 5 6 7 8 9 10 11').split(' '),
                    displayValues: ('1月 2月 3月 4月 5月 6月 7月 8月 9月 10月 11月 12月').split(' '),
                    textAlign: 'left'
                },
                // Days
                {
                    values:[1+"日",2+"日",3+"日",4+"日",5+"日",6+"日",7+"日",8+"日",9+"日",10+"日",11+"日",12+"日",13+"日",14+"日",15+"日",16+"日",17+"日",18+"日",19+"日",20+"日",21+"日",22+"日",23+"日",24+"日",25+"日",26+"日",27+"日",28+"日",29+"日",30+"日",31+"日"]
                }
            ];
        }else if(anyday==3){
        	today = _yesEnd;
        	cols = [
            // Years
                {
                    values: (function () {
                        var arr = [];
                        for (var i = 2005; i <= 2030; i++) { arr.push(i+"年"); }
                        return arr;
                    })()
                },
                // Months
                {
                    values: ('0 1 2 3 4 5 6 7 8 9 10 11').split(' '),
                    displayValues: ('1月 2月 3月 4月 5月 6月 7月 8月 9月 10月 11月 12月').split(' '),
                    textAlign: 'left'
                },
                // Days
                {
                    values:[1+"日",2+"日",3+"日",4+"日",5+"日",6+"日",7+"日",8+"日",9+"日",10+"日",11+"日",12+"日",13+"日",14+"日",15+"日",16+"日",17+"日",18+"日",19+"日",20+"日",21+"日",22+"日",23+"日",24+"日",25+"日",26+"日",27+"日",28+"日",29+"日",30+"日",31+"日"]
                }
            ];
        }
        myPicker = myApp.picker({
            input: _id,
            container: "#picker-date-container",
            toolbar: true,
            scrollToInput: true,
            momentumRatio: 7,
            toolbarTemplate: '<div class="toolbar">'
                                  +'<div class="toolbar-inner">'
                                    +'<div class="left"><a href="#" class="link picker-date-container-cancel'+id+'">取消</a></div>'
                                    +'<div class="center">选择时间</div>'
                                    +'<div class="right">'
                                      +'<a href="#" class="link close-picker picker-date-container-sure">确认</a>'
                                    +'</div>'
                                  +'</div>'
                                +'</div> ',
//          rotateEffect: true,
            value: [today.getFullYear()+"年",today.getMonth(), today.getDate()+"日",today.getHours(), (today.getMinutes() < 10 ? '0' + today.getMinutes() : today.getMinutes())],
            onChange: function (picker, values, displayValues) { //解决日期列随年份和月份变化的最大值
                var $year = picker.value[0].substring(0,picker.value[0].length-1);
                var $month = picker.value[1];
                var daysInMonth = new Date($year,$month*1 + 1, 0).getDate();
                var $values = values[2].substring(0,values[2].length-1);
                if ($values > daysInMonth) {
                    picker.cols[2].setValue(daysInMonth+"日");
                }
            },
            formatValue: function (p, values, displayValues) {
            	var strData = '';
            	if(anyday==2||anyday==3){
            		strData = values[0] +displayValues[1] + values[2];
            	}else{
            		strData = values[0] +displayValues[1] + values[2] + '' + values[3]+':' + values[4];
            	}
               return  strData;
            },
            cols: cols
        });

      } ;
      // 点击取消  取消当前日期的选择
      $(document).on("touchstart",".picker-date-container-cancelstartDate",function(){
         $("#startDate").val("");
         $(".pickerBg").hide();
         $("#picker-date-container").html('');
         myPicker.destroy();
         return false;
      });
      $(document).on("touchstart",".picker-date-container-cancelendDate",function(){
        $("#endDate").val("");
         $(".pickerBg").hide();
         $("#picker-date-container").html('');
         myPicker.destroy();
         return false;
      });
       $(document).on("touchstart",".picker-date-container-cancelteamStartDate",function(){
         $("#teamStartDate").val("");
         $(".pickerBg").hide();
         $("#picker-date-container").html('');
         myPicker.destroy();
         return false;
      });
      $(document).on("touchstart",".picker-date-container-cancelteamEndDate",function(){
        $("#teamEndDate").val("");
         $(".pickerBg").hide();
         $("#picker-date-container").html('');
         myPicker.destroy();
         return false;
      });
       $(document).on("touchstart",".picker-date-container-cancelphotoStartDate",function(){
         $("#photoStartDate").val("");
         $(".pickerBg").hide();
         $("#picker-date-container").html('');
         myPicker.destroy();
         return false;
      });
      $(document).on("touchstart",".picker-date-container-cancelphotoEndDate",function(){
        $("#photoEndDate").val("");
         $(".pickerBg").hide();
         $("#picker-date-container").html('');
         myPicker.destroy();
         return false;
      });  
      // 点击确定  选中当前日期
      $(document).on("touchstart",".picker-date-container-sure",function(e){
        $(".pickerBg").hide();
        $("#picker-date-container").html('');
        myPicker.destroy();
        return false;
      });
