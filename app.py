from flask import Flask, redirect, url_for, request, render_template, jsonify
import jiagu
from neo4j_models import neo4j
import json
from ner import evaluate_line

app = Flask(__name__)
result = {
    "answers": [[], [], [], [], [], []]
}
db = neo4j()
db.connect()


@app.route('/', methods=['POST', 'GET'])  # 两个路由指向同一个网页，返回图的节点和边的结构体
def hello_world():
    return render_template('index.html')


# @app.route('/test')
# def test():
#     token = "陈宇"
#     entitys = db.find_entity(token)
#     print(str(entitys))
#     for entity in entitys:
#         print(entity["x.name"])
#         print(entity["labels(x)"][0])
#         print('==============')
#     return str(entity)


# @app.route('/save/', methods=['POST', 'GET'])  # 两个路由指向同一个网页，返回图的节点和边的结构体
# def save():
    


@app.route('/ajax_re/', methods=['POST'])  # 两个路由指向同一个网页，返回图的节点和边的结构体
def re():
    result['answers'][5] = []
    document = request.form['text']
    document = json.loads(document)
    for token in document:
        # 实体之间的关系
        print(token[0])
        entities2 = db.find_relation_by_entity(token[0])
        # print(entities2)
        if len(entities2) != 0:
            for entity in entities2:
                result['answers'][0].append([entity["n1.name"], entity["type(rel)"], entity["n2.name"]])
                result['answers'][5].append([entity["n1.name"], entity["type(rel)"], entity["n2.name"]])
    return jsonify(result)

@app.route('/ajax_ner/', methods=['POST'])  # 实体识别
def re2():
    result = {
        "answers": [[], [], [], [], [], []]
    }
    document = request.form['text']  # data: {text: checked + bd.toString() + $('#document').val()},
    entities = evaluate_line(document)['entities']
    for entity in entities:
        result['answers'][2].append(entity['word'])
        result['answers'][3].append(entity['word'])
        index = [entity['start'], entity['end']]
        result['answers'][1].append(index)
        result['answers'][4].append([entity['word'],entity['type']])
    return jsonify(result)

if __name__ == '__main__':
    app.run()
