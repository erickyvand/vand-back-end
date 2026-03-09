import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class CreateAdminDto {
  @ApiProperty({ example: 'John Doe' })
  @IsNotEmpty()
  @IsString()
  fullName!: string;

  @ApiProperty({ example: 'john@vand.rw' })
  @IsNotEmpty()
  @Matches(/^[a-zA-Z0-9._%+-]+@vand\.rw$/, {
    message: 'Email must be a @vand.rw address',
  })
  email!: string;

  @ApiProperty({ example: '+250781234567' })
  @IsNotEmpty()
  @Matches(/^(\+250|0)(78|79|72|73)\d{7}$/, {
    message:
      'Phone must be a valid Rwandan number (e.g. +250781234567 or 0781234567)',
  })
  phone!: string;

  @ApiProperty({ example: 'cuid-of-role' })
  @IsNotEmpty()
  @IsString()
  roleId!: string;
}
