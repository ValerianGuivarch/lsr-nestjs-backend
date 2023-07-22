import { PrismicContentType } from './PrismicContentType'
import { CacheValues } from '../../domain/helpers/CacheHelper'
import { IDocumentInformationResponse } from '../../domain/providers/documents/IDocumentInformationResponse'
import { IDocumentProvider } from '../../domain/providers/documents/IDocumentProvider'
import { ProviderErrors } from '../errors/ProviderErrors'
import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { Inject, Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Prismic, { createClient } from '@prismicio/client'
import { PrismicDocument } from '@prismicio/client/src/types/value/document'
import { Cache } from 'cache-manager'

@Injectable()
export class PrismicProvider implements IDocumentProvider {
  private readonly logger = new Logger(PrismicProvider.name)
  private client: Prismic.Client
  private prismicRelease: string

  constructor(private configService: ConfigService, @Inject(CACHE_MANAGER) private cacheManager: Cache) {
    this.prismicRelease = this.configService.get<string>('prismic.release')
    this.client = createClient(this.configService.get<string>('prismic.uri'), {
      accessToken: this.configService.get<string>('prismic.accessToken')
    })
    this.logger.log('Prismic connection success')
  }

  async getSingleDocumentByContentTypeAndLang(contentType: string, lang: string): Promise<PrismicDocument> {
    this.logger.log(`Fetching single document : ${contentType} with lang : ${lang}`)
    try {
      return await this.client.getSingle(contentType)
    } catch (e) {
      throw ProviderErrors.EntityNotFound(contentType)
    }
  }
  async getAllDocumentsByContentTypeAndLang(contentType: string, lang: string): Promise<PrismicDocument[]> {
    this.logger.log(`Fetching all documents : ${contentType} with lang : ${lang}`)
    const documents = await this.client.getAllByType(contentType)
    return documents.filter((document) => document.lang === lang)
  }
  async getAllDocumentsByContentType(contentType: string): Promise<PrismicDocument[]> {
    this.logger.log(`Fetching all documents : ${contentType}`)
    return await this.client.getAllByType(contentType)
  }

  // DONT USE it
  // PREFER using uid because ID change each time a new publish is made
  async getDocumentById(id: string): Promise<PrismicDocument> {
    this.logger.log(`Fetching a document by id : ${id}`)
    const value = (await this.cacheManager.get(id)) as PrismicDocument
    if (value) {
      return value
    }
    try {
      const res = await this.client.getByID(id)
      await this.cacheManager.set(id, res, CacheValues.PRISMIC_DOCUMENT)
      return res
    } catch (e) {
      throw ProviderErrors.EntityNotFound(id)
    }
  }

  async getDocumentByURL(url: string): Promise<PrismicDocument> {
    this.logger.log(`Fetching a document by url : ${url}`)
    const value = (await this.cacheManager.get(url)) as PrismicDocument
    if (value) {
      return value
    }
    try {
      const res = await this.client.getByID(url)
      await this.cacheManager.set(url, res)
      return res
    } catch (e) {
      throw ProviderErrors.EntityNotFound(url)
    }
  }

  async getDocumentByUID(contentType: PrismicContentType, uid: string): Promise<PrismicDocument> {
    this.logger.log(`Fetching document by uid : ${uid}`)
    const value = (await this.cacheManager.get(uid)) as PrismicDocument
    if (value) {
      return value
    }
    try {
      const res = await this.client.getByUID(contentType, uid)
      await this.cacheManager.set(uid, res, CacheValues.PRISMIC_DOCUMENT)
      return res
    } catch (e) {
      throw ProviderErrors.EntityNotFound(uid)
    }
  }

  async getDocumentInformationById(id: string): Promise<IDocumentInformationResponse> {
    this.logger.log(`Fetching a document information by id : ${id}`)
    const value = (await this.cacheManager.get(id)) as PrismicDocument
    if (value) {
      return {
        id: value.id,
        uid: value.uid,
        type: value.type
      } as IDocumentInformationResponse
    }
    try {
      const res = await this.client.getByID(id)
      await this.cacheManager.set(id, res, CacheValues.PRISMIC_DOCUMENT)
      return {
        id: res.id,
        uid: res.uid,
        type: res.type
      } as IDocumentInformationResponse
    } catch (e) {
      throw ProviderErrors.EntityNotFound(id)
    }
  }
}
