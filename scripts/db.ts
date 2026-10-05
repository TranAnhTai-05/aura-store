/**
 * Database maintenance.
 *   npm run db:seed    load the sample data into an empty database
 *   npm run db:upgrade add the sample data that is missing, keeping everything that is there
 *   npm run db:reset   delete everything and load the sample data again
 */
import { connect, disconnect } from '../server/db/pool';
import { dropAllTables, migrate } from '../server/db/schema';
import { addMissingSampleData, isDatabaseEmpty, seed } from '../server/db/seed';

const command = process.argv[2];

async function main() {
  await connect();

  if (command === 'reset') {
    await dropAllTables();
    await migrate();
    await seed();
    console.log('Đã xóa toàn bộ dữ liệu và nạp lại dữ liệu mẫu.');
  } else if (command === 'seed') {
    await migrate();
    if (await isDatabaseEmpty()) {
      await seed();
      console.log('Đã nạp dữ liệu mẫu.');
    } else {
      console.log(
        'Cơ sở dữ liệu đã có dữ liệu, không thay đổi gì. Dùng "npm run db:upgrade" để bổ sung dữ liệu mẫu còn thiếu, hoặc "npm run db:reset" để nạp lại từ đầu.'
      );
    }
  } else if (command === 'upgrade') {
    await migrate();
    const added = await addMissingSampleData();
    console.log(
      `Đã bổ sung ${added.products} sản phẩm, ${added.photos} ảnh, ${added.users} tài khoản, ${added.orders} đơn hàng và ${added.reviews} đánh giá. Dữ liệu sẵn có được giữ nguyên.`
    );
  } else {
    console.error('Lệnh không hợp lệ. Dùng: seed | upgrade | reset');
    process.exitCode = 1;
  }

  await disconnect();
}

main().catch(async (error) => {
  console.error('Thao tác thất bại:', error.message ?? error);
  await disconnect().catch(() => {});
  process.exit(1);
});
