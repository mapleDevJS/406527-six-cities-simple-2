import {inject, injectable} from 'inversify';
import {DocumentType, types} from '@typegoose/typegoose';
import {OfferServiceInterface} from './offer-service.interface.js';
import {Component} from '../../types/component.types.js';
import {LoggerInterface} from '../../common/logger/logger.interface.js';
import {OfferEntity} from './offer.entity.js';
import CreateOfferDto from './dto/create-offer.dto.js';
import UpdateOfferDto from './dto/update-offer.dto.js';
import {SortType} from '../../types/sort-type.enum.js';
import {DEFAULT_OFFER_COUNT} from './offer.constant.js';

@injectable()
export default class OfferService implements OfferServiceInterface {
  constructor(
    @inject(Component.LoggerInterface) private readonly logger: LoggerInterface,
    @inject(Component.OfferModel) private readonly offerModel: types.ModelType<OfferEntity>
  ) {}

  public async create(dto: CreateOfferDto): Promise<DocumentType<OfferEntity>> {
    const result = await this.offerModel.create(dto);
    this.logger.info(`New offer created: ${dto.name}`);
    return result;
  }

  public async findByOfferId(offerId: string): Promise<DocumentType<OfferEntity> | null> {
    return this.offerModel
      .findById(offerId)
      .populate(['userId'])
      .exec();
  }

  public async find(): Promise<DocumentType<OfferEntity>[]> {
    return this.offerModel
      .aggregate([
        {
          $lookup: {
            from: 'comments',
            let: {offerId: '$_id'},
            pipeline: [
              {$match: {$expr: {$eq: ['$offerId', '$$offerId']}}},
              {$project: {_id: 1}}
            ],
            as: 'comments'
          },
        },
        {
          $addFields:
          {id: {$toString: '$_id'}, commentsCount: {$size: '$comments'}}
        },
        {$unset: 'comments'},
        {$limit: DEFAULT_OFFER_COUNT},
        {$sort: {offerCount: SortType.Down}}
      ]).exec();
  }

  public async deleteById(offerId: string): Promise<DocumentType<OfferEntity> | null> {
    return this.offerModel
      .findByIdAndDelete(offerId)
      .exec();
  }

  public async updateById(offerId: string, dto: UpdateOfferDto): Promise<DocumentType<OfferEntity> | null> {
    return this.offerModel
      .findByIdAndUpdate(offerId, dto, {new: true})
      .populate(['userId'])
      .exec();
  }

  public async exists(documentId: string): Promise<boolean> {
    return (await this.offerModel
      .exists({_id: documentId})) !== null;
  }

  public async incCommentCount(offerId: string): Promise<DocumentType<OfferEntity> | null> {
    return this.offerModel
      .findByIdAndUpdate(offerId, {
        '$inc': {
          commentCount: 1,
        }
      }).exec();
  }

  public async findNew(count: number): Promise<DocumentType<OfferEntity>[]> {
    return this.offerModel
      .find()
      .sort({createdAt: SortType.Down})
      .limit(count)
      .populate(['userId'])
      .exec();
  }

  public async findDiscussed(count: number): Promise<DocumentType<OfferEntity>[]> {
    return this.offerModel
      .find()
      .sort({commentCount: SortType.Down})
      .limit(count)
      .populate(['userId'])
      .exec();
  }

  public async findPremiums(): Promise<DocumentType<OfferEntity>[]> {
    return this.offerModel
      .find({isPremium: true})
      .sort({createdAt: SortType.Down})
      .populate(['userId'])
      .exec();
  }

  public async calcRating(offerId: string, newRating: number): Promise<DocumentType<OfferEntity> | null> {
    const oldOffer = await this.offerModel.findById(offerId).lean();
    const oldRating = oldOffer?.rating;

    return this.offerModel
      .findByIdAndUpdate(offerId, {
        '$set': {
          rating: oldRating ? ((oldRating + newRating) / 2).toFixed(1) : newRating,
        }
      }).exec();
  }
}
