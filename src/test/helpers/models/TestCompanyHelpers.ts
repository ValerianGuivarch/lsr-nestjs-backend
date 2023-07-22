import { Company, CompanyToCreate } from '../../../main/domain/models/companies/Company'
import { CompanyType } from '../../../main/domain/models/companies/CompanyType'
import { Chance } from 'chance'

export class TestCompanyHelpers {
  static chance: Chance.Chance = new Chance()
  static generateCompanyToCreate(): CompanyToCreate {
    return {
      name: this.chance.name(),
      email: this.chance.email(),
      phone: this.chance.phone(),
      address: this.chance.address(),
      city: this.chance.city(),
      zip: this.chance.zip(),
      type: this.chance.pickone([CompanyType.FOREMAN, CompanyType.TRANSPORTER]),
      country: this.chance.country(),
      createdDate: this.chance.date(),
      updatedDate: this.chance.date()
    }
  }
  static generateCompany(): Company {
    return {
      id: this.chance.guid(),
      name: this.chance.name(),
      email: this.chance.email(),
      phone: this.chance.phone(),
      address: this.chance.address(),
      city: this.chance.city(),
      zip: this.chance.zip(),
      type: this.chance.pickone([CompanyType.FOREMAN, CompanyType.TRANSPORTER]),
      country: this.chance.country(),
      createdDate: this.chance.date(),
      updatedDate: this.chance.date()
    }
  }

  static updateCompany(company: Company): Company {
    return {
      ...company,
      name: this.chance.name(),
      email: this.chance.email(),
      phone: this.chance.phone(),
      address: this.chance.address(),
      city: this.chance.city(),
      zip: this.chance.zip(),
      type: this.chance.pickone([CompanyType.FOREMAN, CompanyType.TRANSPORTER]),
      country: this.chance.country(),
      createdDate: this.chance.date(),
      updatedDate: this.chance.date()
    }
  }
}
