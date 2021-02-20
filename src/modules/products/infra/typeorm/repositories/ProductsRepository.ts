import { getRepository, Repository, In } from 'typeorm';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICreateProductDTO from '@modules/products/dtos/ICreateProductDTO';
import IUpdateProductsQuantityDTO from '@modules/products/dtos/IUpdateProductsQuantityDTO';
import Product from '../entities/Product';

interface IFindProducts {
  id: string;
}

class ProductsRepository implements IProductsRepository {
  private ormRepository: Repository<Product>;

  constructor() {
    this.ormRepository = getRepository(Product);
  }

  public async create({
    name,
    price,
    quantity,
  }: ICreateProductDTO): Promise<Product> {
    const product = this.ormRepository.create({
      name,
      price,
      quantity,
    });

    await this.ormRepository.save(product);

    return product;
  }

  public async findByName(name: string): Promise<Product | undefined> {
    const product = this.ormRepository.findOne({
      where: { name },
    });

    return product;
  }

  public async findAllById(products: IFindProducts[]): Promise<Product[]> {
    const productIds = products.map(product => product.id);

    const productsExists = await this.ormRepository.find({
      where: {
        id: In(productIds),
      },
    });

    return productsExists;
  }

  public async updateQuantity(
    products: IUpdateProductsQuantityDTO[],
  ): Promise<Product[]> {
    const arrayOfIDs = products.map(
      (productInfo: IUpdateProductsQuantityDTO) => productInfo.id,
    );

    const searchedProducts = await this.ormRepository.find({
      where: { id: In(arrayOfIDs) },
    });

    const updatedProducts = searchedProducts.map(product => {
      const prodInfo = products.find(prod => prod.id === product.id);

      if (prodInfo) {
        const updatedProduct = new Product();
        updatedProduct.id = product.id;
        updatedProduct.name = product.name;
        updatedProduct.price = product.price;
        updatedProduct.quantity = prodInfo.quantity;
        updatedProduct.created_at = product.created_at;
        updatedProduct.updated_at = product.updated_at;

        return updatedProduct;
      }

      return product;
    });

    const createdTransactions = this.ormRepository.create(updatedProducts);

    await this.ormRepository.save(createdTransactions);

    return updatedProducts;
  }
}

export default ProductsRepository;
