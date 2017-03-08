# fis3-deploy-rsync
the deploy plugin for fis3 over rsync


##使用方式
> 需要自行免密，否则会要求输入ssh的密码

```javascript
fis
  .media("fedev226")
  .match("**", {
    deploy: [

      fis.plugin('local-deliver', {
        to: path.join(__dirname, './output/')
      }),
      
      fis.plugin("rsync", {
        from: path.join(__dirname, './output/'),
        to: "username@host:/App/data/www_test"
      })
      
    ]
  });

```
