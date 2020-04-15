let graph_init = function(){
    
    $('#bucket_list_wrapper').hide()
    $('#object_list_wrapper').hide()
    $('#analysis_wrapper').show()
    if($('#analysis_wrapper').find('.nvd3-svg').length > 0){
        graph_clear()
        var timer1 = setInterval(function(){
            if($('#analysis_wrapper').find('.nvd3-svg').length == 0){
                clearInterval(timer1)
                $.ajax({type:'get', url:'/api/v1/test/',
                    success:function(j){
                        graph(j)
                    }
                })
            }
        },500)
    }else{
        $.ajax({type:'get', url:'/api/v1/test/',
            success:function(j){
                graph(j)
            }
        })
    }
}

let graph = function(j){
    console.log(j)
    
    d1 = createData(j)
    object_size = d1.object_size
    object_size_num = d1.object_size_num
    last_modified_size = d1.last_modified_size
    last_modified_num = d1.last_modified_num
    console.log(object_size)

    nv.addGraph(function (){
        var chart = nv.models.multiBarHorizontalChart().x(function (d) {
            return d.label; // Configure x axis to use the "label" within the json.
        })
        .y(function (d) { // Configure y axis to use the "value" within the json.
            return d.value; 
        }).margin({ // Add some CSS Margin to the chart.
            top: 30,
            right: 20,
            bottom: 50,
            left: 105
        })
        .showControls(false)

        chart.yAxis.tickFormat(d3.format('.0d'))

       d3.select('#size_chart1 svg') // Select the ID of the html element we defined earlier.
        .datum(object_size_num) // Pass in the JSON
        .transition().duration(500) // Set transition speed
        .call(chart) // Call & Render the chart

    nv.utils.windowResize(chart.update); // Intitiate listener for window resize so the chart responds and changes width.
    return;
    })

    nv.addGraph(function() {
        var chart = nv.models.pieChart()
            .x(function(d) { return d.label })
            .y(function(d) { return d.value })
            .showLabels(true)     //Display pie labels
            .labelThreshold(.05)  //Configure the minimum slice size for labels to show up
            .labelType("percent") //Configure what type of data to show in the label. Can be "key", "value" or "percent"
            .donut(true)          //Turn on Donut mode. Makes pie chart look tasty!
            .donutRatio(0.6)     //Configure how big you want the donut hole size to be.
      
          d3.select("#last_modified_chart1 svg")
              .datum(last_modified_num)
              .transition().duration(350)
              .call(chart)
      
        nv.utils.windowResize(chart.update)
        return
      })

      nv.addGraph(function (){
        var chart = nv.models.multiBarHorizontalChart().x(function (d) {
            return d.label; // Configure x axis to use the "label" within the json.
        })
        .y(function (d) { // Configure y axis to use the "value" within the json.
            return d.value; 
        }).margin({ // Add some CSS Margin to the chart.
            top: 30,
            right: 20,
            bottom: 50,
            left: 105
        })
        .showControls(false)

        chart.yAxis.tickFormat(d3.format('.3s'))

       d3.select('#size_chart2 svg') // Select the ID of the html element we defined earlier.
        .datum(object_size) // Pass in the JSON
        .transition().duration(500) // Set transition speed
        .call(chart) // Call & Render the chart

        nv.utils.windowResize(chart.update); // Intitiate listener for window resize so the chart responds and changes width.
        return;
    })

    nv.addGraph(function() {
        var chart = nv.models.pieChart()
            .x(function(d) { return d.label })
            .y(function(d) { return d.value })
            .showLabels(true)     //Display pie labels
            .labelThreshold(.05)  //Configure the minimum slice size for labels to show up
            .labelType("percent") //Configure what type of data to show in the label. Can be "key", "value" or "percent"
            .donut(true)          //Turn on Donut mode. Makes pie chart look tasty!
            .donutRatio(0.6)     //Configure how big you want the donut hole size to be.
            ;
      
          d3.select("#last_modified_chart2 svg")
              .datum(last_modified_size)
              .transition().duration(350)
              .call(chart)
      
        nv.utils.windowResize(chart.update)
        return
    })
    total_size  = 0
    
    var timer2 = setInterval(function(){
        if($('#analysis_wrapper').find('.nvd3-svg').length > 0){
            clearInterval(timer2)
            aa = $('#last_modified_chart1').find('g:eq(4)')
            aa.append('<g class="nv-pieLabels" transform="translate(245,145)"><text style="font-size:16px" dy="-0.2em" text-anchor="middle">Total File Num</text>\
            <text style="font-size:20px" dy="1em" text-anchor="middle">'+ j['total_last_num'][5] +'</text></g>')

            aa = $('#last_modified_chart2').find('g:eq(4)')
            aa.append('<g class="nv-pieLabels" transform="translate(245,145)"><text style="font-size:16px" dy="-0.2em" text-anchor="middle">Total Size</text>\
            <text style="font-size:20px" dy="1em" text-anchor="middle">'+ convertByteSize(j['total_last'][5]) +'</text></g>')

            $('#last_modified_chart1').html($('#last_modified_chart1').html())
            $('#last_modified_chart2').html($('#last_modified_chart2').html())
        }
    },500)
}

let graph_clear = function(){

    $('#size_chart1').html("<svg></svg>")
    $('#last_modified_chart1').html("<svg></svg>")
    $('#size_chart2').html("<svg></svg>")
    $('#last_modified_chart2').html("<svg></svg>")

}

let createData = function(d){
    var object_size = [{
        key: "Sum of File Size",
        values: [{
            "label":"<1MiB",
            "value":d.total_size[0]
        },
        {
            "label":"1MiB to 10MiB",
            "value":d.total_size[1]
        },
        {
            "label":"10MiB to 100MiB",
            "value":d.total_size[2]
        },
        {
            "label":"100MiB to 1GiB",
            "value":d.total_size[3]
        },
        {
            "label":">1GiB",
            "value":d.total_size[4]
        }]
    }]

    var object_size_num = [{
        key: "Number of Files",
        values: [{
            "label":"<1MiB",
            "value":d.total_size_num[0]
        },
        {
            "label":"1MiB to 10MiB",
            "value":d.total_size_num[1]
        },
        {
            "label":"10MiB to 100MiB",
            "value":d.total_size_num[2]
        },
        {
            "label":"100MiB to 1GiB",
            "value":d.total_size_num[3]
        },
        {
            "label":">1GiB",
            "value":d.total_size_num[4]
        }]
    }]

var last_modified_size = [
    {
        "label":"<1 hour",
        "value":d.total_last[0]
    },
    {
        "label":"1hour to 1day",
        "value":d.total_last[1]
    },
    {
        "label":"1day to 1week",
        "value":d.total_last[2]
    },
    {
        "label":"1week to 1month",
        "value":d.total_last[3]
    },
    {
        "label":">1month",
        "value":d.total_last[4]
}]

var last_modified_num = [
    {
        "label":"<1 hour",
        "value":d.total_last_num[0]
    },
    {
        "label":"1hour to 1day",
        "value":d.total_last_num[1]
    },
    {
        "label":"1day to 1week",
        "value":d.total_last_num[2]
    },
    {
        "label":"1week to 1month",
        "value":d.total_last_num[3]
    },
    {
        "label":">1month",
        "value":d.total_last_num[4]
}]
    return {'object_size':object_size,'object_size_num':object_size_num,'last_modified_size':last_modified_size,'last_modified_num':last_modified_num}
}