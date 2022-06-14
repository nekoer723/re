
// 画布cy
var cy = cytoscape({

    container: document.getElementById('cy'), // container to render in
    userZoomingEnabled: false,
    userPanningEnabled: false,
    zoom: 1,
    minZoom: 1,
    maxZoom: 1,
    style: [ // the stylesheet for the graph
        {
            selector: 'node',
            style: {
                'background-color': '#666',
                'label': 'data(show)',
                // 'text-valign': 'center'
            }
        },
        {
            selector: 'edge',
            style: {
                'width': 3,
                'line-color': '#ccc',
                'target-arrow-color': '#ccc',
                'target-arrow-shape': 'triangle',
                'curve-style': 'bezier',
                'label': 'data(re)',
            }
        }
    ],

    pan: {
        x: 100,
        y: 100
    },
    layout: {
        name: 'random',

        fit: true, // whether to fit to viewport
        padding: 30, // fit padding
        boundingBox: { x1: 0, y1: 0, x2: 500, y2: 500 }, // constrain layout bounds; { x1, y1, x2, y2 } or { x1, y1, w, h }
        animate: true, // whether to transition the node positions
        animationDuration: 500, // duration of animation in ms if enabled
        animationEasing: undefined, // easing of animation if enabled
        animateFilter: function (node, i) { return true; }, // a function that determines whether the node should be animated.  All nodes animated by default on animate enabled.  Non-animated nodes are positioned immediately when the layout starts
        ready: undefined, // callback on layoutready
        stop: undefined, // callback on layoutstop
        transform: function (node, position) { return position; } // transform a given node position. Useful for changing flow direction in discrete layouts 
    }
});
// 用于装边和节点的集合
var edgesAndNodes = []
// 用于装新增的节点和边的集合
var three
var tow
var newEdgeAndNode = {
    edges : [],
    nodes : []
}
// 创建一个新节点(实体)
function createNewNode() {
    var name = $('#entity-name').val()
    var label = $('#entity-label').val()
    if(name == "" || label==""){
        alert("实体名字和标签不能为空")
        return
    }
    try {
        cy.add({
            group: 'nodes',
            data: {
                id: name,
                label: label,
                show:name+'类别:'+label
            },
            renderedPosition: {
                x: 30,
                y: 30
            }
        }).style({
            'width': 40,
            'height': 40
        })
        newEdgeAndNode.nodes.push({name:name,label:label})
    } catch (error) {
        alert(error)
    }
};
// 创建新的边
function createNewEdge() {
    var re = $('#edge-re').val()
    var source = $('#edge-source').val()
    var target = $('#edge-target').val()
    if(re == "" || source=="" || target==""){
        alert("不能为空!")
        return
    }
    try {
        cy.add({
            group: 'edges',
            data: {
                id: source+re+target,
                source: source,
                target: target,
                re: re
            }
        })
        newEdgeAndNode.edges.push({name:source+re+target,re:re,source:source,target:target})
    } catch (error) {
        alert(error)
    }
};
// 清空画布
function clearCy() {
    // 清空tow和three
    tow = []
    three = []
    // 清空result里的添加的按钮
    $('#ner-result').empty()
    // 清空document
    $('#document').val("")
    cy.elements().remove()
}
// 画布可视化展示当前集合里的点和边
function cyShowAnswers(){
    cy.elements().remove()
    cy.add(
        edgesAndNodes
    )
    cy.layout({
        name: 'random'
    }).run();
}
// 去后端分析结果
function nre() {
    // 验证tow是否为空
    if(tow == null||tow.length == 0){
        alert("没有实体！")
        return
    }
    $.ajax({
        type: 'POST',
        url: '/ajax_re/',
        data: { "text": JSON.stringify(tow) },
        dataType: 'json',
        beforeSend: function () {
            $('#btn-analyse').html('正在分析...');
            $('#btn-analyse').attr('disabled', true);
            $('.answer').empty();
        }, error: function () {
            $('#btn-analyse').html('请求失败,请重试');
            $('#btn-analyse').attr('disabled', false);
        }, success: function (res) {
            var res1 = res.answers
            $('#btn-analyse').html('分析');
            $('#btn-analyse').attr('disabled', false);
            three = res1[5] //[token1,re,token2]
            if(three.length == 0){
                alert("实体间没有关系")
                return
            }
            for (let i = 0; i < three.length; i++) {
                var flag1 = 0;
                // 验证three中的实体在不在tow中,如果不在tow中，就删除three中的实体
                for (let j = 0; j < tow.length; j++) {
                    if (three[i][0] == tow[j][0]) {
                        flag1++;
                        break;
                    }
                }
                for (let j = 0; j < tow.length; j++) {
                    if (three[i][2] == tow[j][0]) {
                        flag1++;
                        break;
                    }
                }
                if (flag1 < 2) {
                    three.splice(i, 1);
                    i--;
                    continue
                }
                // 创建边
                if(flag1 == 2){
                    try {
                        cy.add({
                            group: 'edges',
                            data: {
                                id: three[i][0] + three[i][1] + three[i][2],
                                source: three[i][0],
                                target: three[i][2],
                                re: three[i][1]
                            }
                        })
                    } catch (error) {
                        alert(error)
                    }
                }
            }
        }
    })
}
// 保存新建的实体和关系
function ner(){
    // 验证document是否为空
    if($('#document').val()==""){
        alert("文本不能为空")
        return
    }
    $.ajax({
        type: 'POST',
        url: '/ajax_ner/',
        data: { text: $('#document').val() },
        dataType: 'json',
        beforeSend: function () {
            tow = []
            three = []
            // 清空result里的添加的按钮
            $('#ner-result').empty()
            // 清空document
            cy.elements().remove()
            $('#btn-ner').html('正在实体识别...');
            $('#btn-ner').attr('disabled', true);
            $('.answer').empty();
        }, error: function () {
            $('#btn-ner').html('请求失败,请重试');
            $('#btn-ner').attr('disabled', false);
        }, success: function (res) {
            var res1 = res.answers
            $('#btn-ner').html('实体识别');
            $('#btn-ner').attr('disabled', false);
            three = []
            tow = res1[4] //[id,label]
            edgesAndNodes = []
            for (let i = 0; i < tow.length; i++) {
                edgesAndNodes.push({group:'nodes',data:{id:tow[i][0],label:tow[i][1],show:tow[i][0]+'类别:'+tow[i][1]}}) 
            }
            entityChange()
            cyShowAnswers(edgesAndNodes)
        }
    })
}
$('#outputButton').on('click', function () {
    var out = {};
    out['text'] = $('#document').val();
    out['实体'] = tow;
    var link = document.createElement('a');
    link.download = '关系抽取.txt';
    link.style.display = 'none';
    var blob = new Blob([JSON.stringify(out, null, 4)]);
    var src = URL.createObjectURL(blob);
    link.href = src;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});
function showentity(token1){
    var flag = 0; //用于判断是否有改变
    for (var i in three){
        r = three[i];
        // 如果有相关的边
        if(r[0]==token1||r[2]==token1)
        {
            flag = 1;
            edgesAndNodes = [];
            // 在tow中查找r[0]和r[2],添加到edgesAndNodes中
            for(let j = 0;j<tow.length;j++){
                if(r[0] == tow[j][0]){
                    edgesAndNodes.push({group:'nodes',data:{id:tow[j][0],label:tow[j][1],show:tow[i][0]+'类别:'+tow[i][1]}})
                }
                if(r[2] == tow[j][0]){
                    edgesAndNodes.push({group:'nodes',data:{id:tow[j][0],label:tow[j][1],show:tow[i][0]+'类别:'+tow[i][1]}})
                }
            }
            edgesAndNodes.push({group:'edges',data:{re:r[1],source:r[0],target:r[2],id:r[0]+r[1]+r[2]}})
        }
    }
    for (var i in tow){
        e = tow[i];
        if(e[0]==token1)
        {
            if(flag==0){
                flag = 1;
                edgesAndNodes = [];
            }
            // 在edgesAndNodes中查找是否存在e[0]
            var flag1 = 0;
            for(let j = 0;j<edgesAndNodes.length;j++){
                if(edgesAndNodes[j].data.id == e[0]){
                    flag1++;
                }
            }
            if(flag1 == 0){
                edgesAndNodes.push({group:'nodes',data:{id:e[0],label:e[1],show:e[0]+'类别:'+e[1]}})
            }
        }
    }
    if(flag==1){
        cyShowAnswers(edgesAndNodes)
    }
}
function entityChange(){
    // 将tow中的实体作为按钮添加到result中
    $('#ner-result').empty();
    for (var i in tow){
        e = tow[i];
        var btn = $('<button class="btn btn-primary" onclick="showentity(\''+e[0]+'\')">'+e[0]+'</button>');
        $('#ner-result').append(btn);
    }
}
document.getElementById('btn-createNode').onclick = createNewNode
document.getElementById('btn-createEdge').onclick = createNewEdge
document.getElementById('btn-clear').onclick = clearCy
document.getElementById('btn-nre').onclick = nre
//document.getElementById('btn-save').onclick = save
document.getElementById('btn-ner').onclick = ner


// javascript、 cytoscape（知识图谱可视化的）、jQuery、Ajax、
// flask，，实体识别： 关系抽取：