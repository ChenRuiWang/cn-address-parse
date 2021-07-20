import AddressParser from '../index';

test('testFullAddress', () => {
  expect(AddressParser.parse('深圳市宝安区新安街道128号沙县小吃, 电话：13144381379，收件人：张三 身份证号: 110101192007207351')).toEqual({
    phoneNumber: '13144381379',
    name: '张三',
    idon: '110101192007207351',
    street: '新安街道128号沙县小吃',
    zip: '440306',
    province: '广东省',
    city: '深圳市',
    region: '宝安区'
  });
});

test('testShortSplitAddress', () => {
  expect(AddressParser.parse("宝安区新安街道128号沙县小吃 张三 13144381379")).toEqual({
    phoneNumber: '13144381379',
    name: '张三',
    idon: '',
    street: '新安街道128号沙县小吃',
    zip: '440306',
    province: '广东省',
    city: '深圳市',
    region: '宝安区'
  });
});

test('testShortCompactAddress', () => {
  expect(AddressParser.parse("宝安区新安街道128号沙县小吃A张三13144381379")).toEqual({
    phoneNumber: '13144381379',
    name: '张三',
    idon: '',
    street: '新安街道128号沙县小吃A',
    zip: '440306',
    province: '广东省',
    city: '深圳市',
    region: '宝安区'
  });
});