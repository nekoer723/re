# encoding=utf8
import pickle
import tensorflow as tf
from model.model import Model
from model.utils import load_config,get_logger,create_model
from model.data_utils import load_word2vec, input_from_line

flags = tf.app.flags

flags.DEFINE_string("ckpt_path",    "ckpt",      "Path to save model")
flags.DEFINE_string("log_file",     "model/train.log",    "File for log")
flags.DEFINE_string("map_file",     "model/maps.pkl",     "file for maps")
flags.DEFINE_string("config_file",  "model/config_file",  "File for config")

FLAGS = tf.app.flags.FLAGS

def evaluate_line(str):
    config = load_config(FLAGS.config_file)
    logger = get_logger(FLAGS.log_file)
    tf_config = tf.ConfigProto()
    tf_config.gpu_options.allow_growth = True
    with open(FLAGS.map_file, "rb") as f:
        char_to_id, id_to_char, tag_to_id, id_to_tag = pickle.load(f)
    with tf.Session(config=tf_config) as sess:
        model = create_model(sess, Model, FLAGS.ckpt_path, load_word2vec, config, id_to_char, logger)
        result = model.evaluate_line(sess, input_from_line(str, char_to_id), id_to_tag)
        return result

