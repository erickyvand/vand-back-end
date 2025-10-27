import { Response } from 'express';

import AppController from './app.controller';
import LoggerService from './logger/logger.service'; // Import LoggerService

describe('AppController', () => {
  let appController: AppController;
  let mockResponse: Response;
  let mockLoggerService: Partial<LoggerService>; // Use Partial to only define the needed methods

  beforeEach(() => {
    mockLoggerService = {
      handleInfoLog: jest.fn(), // Mock handleInfoLog method
    };

    appController = new AppController(mockLoggerService as LoggerService); // Pass the mock LoggerService
    mockResponse = {
      send: jest.fn(),
      // Add other Response methods as needed
    } as unknown as Response;
  });

  it('/ (GET)', () => {
    appController.getHello(mockResponse);
    expect(mockResponse.send).toHaveBeenCalledWith('Hello World!');
  });
});
