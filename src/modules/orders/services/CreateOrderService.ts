import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,
    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,
    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    // TODO
    const customer = await this.customersRepository.findById(customer_id);

    if (!customer) {
      throw new AppError('Customer not found');
    }

    const productsId = products.map(product => {
      return { id: product.id };
    });

    const productsInStockInfo = await this.productsRepository.findAllById(
      productsId,
    );

    if (
      !productsInStockInfo ||
      productsInStockInfo.length !== productsId.length
    ) {
      throw new AppError('Invalid product id');
    }

    const productsInOrder = products.map((product, index) => {
      if (product.quantity > productsInStockInfo[index].quantity) {
        throw new AppError('Not enought product in stock');
      }

      return {
        product_id: product.id,
        price: productsInStockInfo[index].price,
        quantity: product.quantity,
      };
    });

    const newOrder = await this.ordersRepository.create({
      customer,
      products: productsInOrder,
    });

    const productsInStockUpdated = products.map((product, index) => {
      return {
        id: product.id,
        quantity: productsInStockInfo[index].quantity - product.quantity,
      };
    });

    await this.productsRepository.updateQuantity(productsInStockUpdated);

    return newOrder;
  }
}

export default CreateOrderService;
