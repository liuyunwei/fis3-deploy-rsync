# fis3-deploy-rsync
这是fis3的一个deploy插件，通过rsync来部署文件到远端机器，通常情况下需要结合fis3-deploy-local-deliver（该插件用来发布文件到本地）使用。local-deliver发布的文件夹作为rsync的需要同步的文件。


##使用方式
> 使用windows的同学需要安装cgwin以及rsync插件
> 需要自行在目标机器上进行rsync/ssh免密，否则会要求输入ssh的密码

安装：`npm install fis3-deploy-rsync --save-dev`
```javascript

var cache = path.join(__dirname, './output/');

fis
  .media("fedev226")
  .match("**", {
    deploy: [

      fis.plugin('local-deliver', {
        to:  cache
      }),
      
      fis.plugin("rsync", {
        from: cache,       // 此处需要与local-deliver的to参数值相同
        to: "username@host:/App/data/www_test"
      })
      
    ]
  });

```

使用`fis3 release fedev226 -w` 即可发布


##工作过程
一般情况下，会直接通过rsync文件夹的方式进行同步，转换成shell为
`rsync fromDir  username@host:toDir`
在fis3的-w模式下，一般的修改保存过程，只会有少数文件变动，会采用同步改动文件的方式
`rsync fromDir/modifiedFile username@host:toDir/modifiedFile`
>有两个注意事项：1，from文件夹后面以"/"结束时，如示例，会同步文件夹中的内容，否则，则会在远程机器上创建该文件夹，多出一层目录。2，rsync单个文件的时候，如果远程机器上不能递归创建文件目录，客户端会报错，此时只需重新`fis3 release fedev226 -w`即可（可以做到自动创建，但是有损性能，不值得）。
