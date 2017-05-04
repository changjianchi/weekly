## 其他

* 直播二期需求评审

* 讨论直播C页面迁移sf方案 - (暂定，不确定能不能行得通)

    * 结论：sf嵌套mip-iframe嵌套iframe（资源方页面）
    * 也就是sf -> mip-iframe -> iframe -> 资源方页面

* 调研postMessage在嵌套两层iframe下能不能传递数据

    * 结果：sf的数据只能先传到第一个iframe当中，然后第一个iframe再把数据传到第二个iframe中，不能直接从最外层传递到最内层的iframe当中