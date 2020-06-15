import iscope from './iscope';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

test('should receive scope correctly in nested function sync calls', () => {
  const result = iscope(1, () => {
    return iscope() + 1;
  });
  expect(result).toBe(2);
});

test('should receive scope correctly in nested function async calls', async () => {
  const result1 = iscope(1, async () => {
    await delay(20);
    return iscope() + 1;
  });

  const result2 = iscope(2, async () => {
    await delay(10);
    return iscope() + 1;
  });

  await delay(25);

  expect(await result1).toBe(2);
  expect(await result2).toBe(3);
});

test('multiple scope types', () => {
  const iscope1 = iscope(1);
  const iscope2 = iscope(2);

  expect(iscope1()).toBe(1);
  expect(iscope2()).toBe(2);

  function sum() {
    return iscope1() + iscope2();
  }

  const result = iscope(
    [
      [iscope1, 2],
      [iscope2, 4],
    ],
    sum,
  );

  expect(result).toBe(6);
});
