-- AddForeignKey
ALTER TABLE "esim_orders" ADD CONSTRAINT "esim_orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
