using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using MisrImageSelector.Api.Commands;
using MisrImageSelector.Api.Persistence;

var builder = WebApplication.CreateBuilder(args);

builder.Configuration.AddEnvironmentVariables();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters()
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration.GetValue<string>("JwtSettings:Issuer")!,
            ValidAudience = builder.Configuration.GetValue<string>("JwtSettings:Audience")!,
            IssuerSigningKey =
                new SymmetricSecurityKey(
                    Encoding.UTF8.GetBytes(builder.Configuration.GetValue<string>("JwtSettings:SecretKey")!))
        };
    });

builder.Services.AddAuthorization();

builder.Services.AddDbContext<ApplicationContext>(options =>
{
    options.UseSqlite(builder.Configuration.GetConnectionString("Default"));
});

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(corsPolicyBuilder => 
        corsPolicyBuilder
            .WithOrigins(builder.Configuration.GetValue<string>("FrontendUrl")!)
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials());
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ApplicationContext>();
    await db.Database.MigrateAsync();
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();

app.UseAuthentication();
app.UseAuthorization();

app.UseHttpsRedirection();

app.MapPost("api/login", (IConfiguration configuration) =>
{
    var jwtSettings = configuration.GetSection("JwtSettings");
    var secretKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings["SecretKey"]!));
    var signingCredentials = new SigningCredentials(secretKey, SecurityAlgorithms.HmacSha256);
    
    var claims = new[]
    {
        new Claim(ClaimTypes.NameIdentifier, Guid.NewGuid().ToString())
    };
    
    var token = new JwtSecurityToken(
        issuer: jwtSettings["Issuer"],
        audience: jwtSettings["Audience"],
        claims: claims,
        expires: DateTime.Now.AddDays(365),
        signingCredentials: signingCredentials
    );
    
    var tokenHandler = new JwtSecurityTokenHandler();
    var encodedToken = tokenHandler.WriteToken(token);
    
    return Results.Ok(new { token = encodedToken });
});

app.MapPost("api/vote", async (ApplicationContext db, HttpContext context, VoteCommand command) =>
{
    var session = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    
    if (session is null)
    {
        context.Response.StatusCode = 401;
        return;
    }
    
    var existingVote = await db.Votes.FirstOrDefaultAsync(vote => vote.SessionId == session && vote.ImageId == command.ImageId);
    
    if (existingVote is not null)
    {
        context.Response.StatusCode = 409;
        return;
    }
    
    var vote = new Vote
    {
        LpipsScore = command.LpipsScore,
        SessionId = session,
        ImageId = command.ImageId
    };
    
    db.Votes.Add(vote);
    await db.SaveChangesAsync();
    
    context.Response.StatusCode = 201;
}).RequireAuthorization();

app.MapGet("api/vote", async (ApplicationContext db) =>
{
    var votes = await db.Votes.ToListAsync();
    return Results.Ok(votes);
});

app.Run();
