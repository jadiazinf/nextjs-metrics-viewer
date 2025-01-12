import { LoginService } from "@/app/api/auth/[...nextauth]/services/login";
import { DatabaseConnection } from "@/lib/db";
import { users } from "@/lib/db/schemas/user";
import { UnauthorizedError } from "@/lib/errors";
import { UserFactory } from "@/test/factories/users";
import { UserModel } from "@/domain/users/model";
import UserUtilities from "@/domain/users/utilities";
import { eq } from "drizzle-orm";

describe("UserAuthLoginService", () => {
  const mockUser = UserFactory.validUser().build();

  beforeAll(async () => {
    const db = DatabaseConnection.getInstance().db;
    await db.insert(users).values({
      ...mockUser,
      password: await UserUtilities.encryptPassword(mockUser.password),
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    const db = DatabaseConnection.getInstance().db;
    await db.delete(users).where(eq(users.email, mockUser.email));
  });

  it("should return user and token on successful login", async () => {
    const service = new LoginService(
      mockUser.email,
      mockUser.password,
      DatabaseConnection.getInstance().db,
    );
    const { user } = await service.perform();
    expect(user).toBeInstanceOf(UserModel);
  });

  it("should throw UnauthorizedError when user email not found", async () => {
    const service = new LoginService(
      "user@email.com",
      mockUser.password,
      DatabaseConnection.getInstance().db,
    );

    await expect(service.perform()).rejects.toThrow(UnauthorizedError);
  });

  it("should throw UnauthorizedError when user password not found", async () => {
    const service = new LoginService(
      mockUser.email,
      "",
      DatabaseConnection.getInstance().db,
    );

    await expect(service.perform()).rejects.toThrow(UnauthorizedError);
  });
});
