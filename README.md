# Chinese address parser
中国地址自动解析。

Bug反馈: [issuse](https://github.com/ChenRuiWang/cn-address-parse/issues)

## Install
```sh
npm i cn-address-parse
```

## Usage
```javascript
import AddressParser from 'cn-address-parse'

AddressParser.parse('深圳市宝安区新安街道128号沙县小吃, 电话：13144381379，收件人：张三 身份证号: 110101192007207351');

// output
{
    phoneNumber: '13144381379',
    name: '张三',
    idon: '110101192007207351',
    street: '新安街道128号沙县小吃',
    zip: '440306',
    province: '广东省',
    city: '深圳市',
    region: '宝安区'
}
```
## Contribution
Fork 本项目

修改后执行:
```sh
npm run test
```

提交[PR](https://github.com/ChenRuiWang/cn-address-parse/pulls)

## LICENSE
[MIT](https://github.com/ChenRuiWang/cn-address-parse/blob/master/LICENSE)
