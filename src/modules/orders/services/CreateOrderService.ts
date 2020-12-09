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
    const customerExists = await this.customersRepository.findById(customer_id);

    if (!customerExists) {
      throw new AppError('Coud not find and customer');
    }

    const productsExists = await this.productsRepository.findAllById(products);

    if (!productsExists.length) {
      throw new AppError('Coud not find and products');
    }

    const productsExistsIds = productsExists.map(product => product.id);

    const checkInexistsProduct = products.filter(
      product => !productsExistsIds.includes(product.id),
    );

    if (checkInexistsProduct.length) {
      throw new AppError(
        `Coud not find and products:${checkInexistsProduct[0].id}`,
      );
    }

    const findProductsWhithNoQuantityAvaliable = products.filter(
      product =>
        productsExists.filter(prod => prod.id === product.id)[0].quantity <=
        product.quantity,
    );

    if (findProductsWhithNoQuantityAvaliable) {
      throw new AppError(
        `The quantity ${findProductsWhithNoQuantityAvaliable[0].quantity} is not available from ${findProductsWhithNoQuantityAvaliable[0].id}`,
      );
    }

    const seriarizedProducts = products.map(product => ({
      product_id: product.id,
      quantity: product.quantity,
      price: productsExists.filter(p => p.id === product.id)[0].price,
    }));

    const order = await this.ordersRepository.create({
      customer: customerExists,
      products: seriarizedProducts,
    });

    const { order_products } = order;

    const ordersProductQuantity = order_products.map(product => ({
      id: product.product_id,
      quantity:
        productsExists.filter(p => p.id === product.product_id)[0].quantity -
        product.quantity,
    }));

    await this.productsRepository.updateQuantity(ordersProductQuantity);

    return order;
  }
}

export default CreateOrderService;
