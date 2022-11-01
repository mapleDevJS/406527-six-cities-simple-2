import {IsBoolean, IsEmail, IsString, Length} from 'class-validator';

export default class CreateUserDto {
  @IsEmail({}, {message: 'email must be valid address'})
  public email!: string ;

  @IsString({message: 'firstname is required'})
  @Length(1, 15, {message: 'Min length is 1, max is 15'})
  public firstName!: string;

  @IsString({message: 'lastname is required'})
  @Length(1, 15, {message: 'Min length is 1, max is 15'})
  public lastName!: string;

  @IsBoolean({message: 'isPro must be true or false'})
  public isPro!: boolean;

  @IsString({message: 'password is required'})
  @Length(6, 12, {message: 'Min length for password is 6, max is 12'})
  public password!: string;
}
