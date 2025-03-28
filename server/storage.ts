import { 
  users, 
  stlFiles, 
  processingResults, 
  processingSettings,
  type User, 
  type InsertUser, 
  type StlFile, 
  type InsertStlFile,
  type ProcessingResult,
  type InsertProcessingResult,
  type ProcessingSetting,
  type InsertProcessingSetting,
  type ScrewResult
} from "@shared/schema";

// Storage interface
export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // STL file management
  getStlFilesBySession(sessionId: string): Promise<StlFile[]>;
  getStlFilesBySessionAndType(sessionId: string, fileType: string): Promise<StlFile[]>;
  saveStlFile(file: InsertStlFile): Promise<StlFile>;
  deleteStlFile(id: number): Promise<boolean>;
  
  // Processing results
  getResultsBySession(sessionId: string): Promise<ProcessingResult | undefined>;
  saveProcessingResult(result: InsertProcessingResult): Promise<ProcessingResult>;
  getResultById(id: number): Promise<ProcessingResult | undefined>;
  
  // Settings
  getSettingsForUser(userId: number): Promise<ProcessingSetting | undefined>;
  saveSettings(settings: InsertProcessingSetting): Promise<ProcessingSetting>;
  getDefaultSettings(): Promise<ProcessingSetting>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private stlFiles: Map<number, StlFile>;
  private processingResults: Map<number, ProcessingResult>;
  private settings: Map<number, ProcessingSetting>;
  
  userCurrentId: number;
  fileCurrentId: number;
  resultCurrentId: number;
  settingsCurrentId: number;

  constructor() {
    this.users = new Map();
    this.stlFiles = new Map();
    this.processingResults = new Map();
    this.settings = new Map();
    
    this.userCurrentId = 1;
    this.fileCurrentId = 1;
    this.resultCurrentId = 1;
    this.settingsCurrentId = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // STL file methods
  async getStlFilesBySession(sessionId: string): Promise<StlFile[]> {
    return Array.from(this.stlFiles.values()).filter(
      (file) => file.sessionId === sessionId
    );
  }
  
  async getStlFilesBySessionAndType(sessionId: string, fileType: string): Promise<StlFile[]> {
    return Array.from(this.stlFiles.values()).filter(
      (file) => file.sessionId === sessionId && file.fileType === fileType
    );
  }
  
  async saveStlFile(file: InsertStlFile): Promise<StlFile> {
    const id = this.fileCurrentId++;
    const timestamp = new Date();
    const stlFile: StlFile = { ...file, id, uploadedAt: timestamp };
    this.stlFiles.set(id, stlFile);
    return stlFile;
  }
  
  async deleteStlFile(id: number): Promise<boolean> {
    return this.stlFiles.delete(id);
  }
  
  // Processing results methods
  async getResultsBySession(sessionId: string): Promise<ProcessingResult | undefined> {
    return Array.from(this.processingResults.values()).find(
      (result) => result.sessionId === sessionId
    );
  }
  
  async getResultById(id: number): Promise<ProcessingResult | undefined> {
    return this.processingResults.get(id);
  }
  
  async saveProcessingResult(result: InsertProcessingResult): Promise<ProcessingResult> {
    const id = this.resultCurrentId++;
    const timestamp = new Date();
    const processingResult: ProcessingResult = { ...result, id, processedAt: timestamp };
    this.processingResults.set(id, processingResult);
    return processingResult;
  }
  
  // Settings methods
  async getSettingsForUser(userId: number): Promise<ProcessingSetting | undefined> {
    return Array.from(this.settings.values()).find(
      (setting) => setting.userId === userId
    );
  }
  
  async saveSettings(settings: InsertProcessingSetting): Promise<ProcessingSetting> {
    const id = this.settingsCurrentId++;
    const processingSettings: ProcessingSetting = { ...settings, id };
    this.settings.set(id, processingSettings);
    return processingSettings;
  }
  
  async getDefaultSettings(): Promise<ProcessingSetting> {
    return {
      id: 0,
      userId: null,
      tolerance: "0.5",
      colorScheme: "standard",
      showAxes: true,
      showMeasurements: true,
      highlightBreaches: true,
      enableTransparency: false
    };
  }
}

export const storage = new MemStorage();
