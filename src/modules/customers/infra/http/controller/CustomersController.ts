import { Request, Response } from 'express';

import CreateCustomerService from '@modules/customers/services/CreateCustomerService';

import { container } from 'tsyringe';

export default class CustomersController {
  public async create(request: Request, response: Response): Promise<Response> {
    const { name, email } = request.body;

    const CreateCustomer = container.resolve(CreateCustomerService);

    const customer = await CreateCustomer.execute({ name, email });

    const data = { email: customer.email, name: customer.name };

    return response.json(data);
  }
}
