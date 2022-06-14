# -*- coding: utf-8 -*-
from py2neo import Graph, NodeMatcher


# 版本说明：Py2neo v4
class neo4j():
    graph = None
    matcher = None

    def __init__(self):
        print("----------neo4j数据库已连接---------")

    def connect(self):
        self.graph = Graph("neo4j://localhost:7687", user="neo4j", password="123456")
        self.matcher = NodeMatcher(self.graph)

    def find_entity(self, entity):
        answer = self.graph.run("MATCH(x) WHERE x.name = '" + entity + "' return labels(x),x.name").data()
        return answer

    def find_relation_by_entities(self, entity1, entity2):
        answer = self.graph.run(
            "MATCH (n1{name:'" + entity1 + "'})- [rel] -> (n2{name:'" + entity2 + "'}) RETURN n1,rel,n2").data()
        return answer

    def find_relation_by_entity(self, entity):
        answer = self.graph.run(
            "MATCH (n1{name:'" + entity + "'})- [rel] -> (n2) RETURN n1.name,type(rel),n2.name").data()
        return answer

    def create_node1(self, node_type, dictionary):
        string_list = []
        for key, value in dictionary.items():
            # 利用格式化函数
            if key == "name":
                s = "{0}{1}{2}{3}{2}".format(key, ":", "'", value)
            else:
                s = "{0}{1}{2}{3}{4}{3}".format(",", key, ":", "'", value)
            # 将字符串添加到列表中  便于后续字符串拼接
            string_list.append(s)
        # 进行字符串拼接
        st_list = "".join(string_list)
        order = "CREATE(x:" + node_type + "{" + st_list + "})"
        self.graph.run(order)

    def create_node2(self, node_name, node_type):
        st = "CREATE(x:" + node_type + "{" + " name:'" + node_name + "'" + "})"
        self.graph.run(st)
        
    def insert_relation1(self, node_name1, node_type1, relation, relation_attribute, node_name2, node_type2):
        self.graph.run(
            "MATCH (x:" + node_type1 + "{name:'" + node_name1 + "'}), (y:" + node_type2 + "{name:'" + node_name2 + "'})"
            + " MERGE (x)-[:" + relation + "{Value:'" + relation_attribute + "'}]->(y)")

    def update_node(self, entity, entity_type):
        string_list = []
        i = 0
        for key, value in entity.items():
            # 利用格式化函数
            if i == 0:
                st = "{0}{1}{2}{3}{4}{3}".format("x.", key, "=", "'", value)
            else:
                st = "{0}{1}{2}{3}{4}{3}".format(", x.", key, "=", "'", value)
            # 将字符串添加到列表中  便于后续字符串拼接
            string_list.append(st)
            i = i+1
        # 进行字符串拼接
        st_list = "".join(string_list)
        str = "MATCH(x) WHERE x.name='" + entity['name'] + "' SET " + st_list
        if len(entity_type) != 0:
            str = str + "REMOVE x:地区 SET x:" + entity_type + ', '
        str = str + st_list
        self.graph.run(str)
