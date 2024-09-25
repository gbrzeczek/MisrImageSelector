using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.EntityFrameworkCore;
using MisrImageSelector.Api.Commands;
using MisrImageSelector.Api.Persistence;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddAuthentication().AddCookie();
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

app.MapPost("api/login", async context =>
{
    var isUserAuthenticated = context.User.Identity?.IsAuthenticated ?? false;
    
    if (isUserAuthenticated)
    {
        context.Response.StatusCode = 200;
        return;
    }
    
    var claims = new List<Claim>
    {
        new(ClaimTypes.NameIdentifier, Guid.NewGuid().ToString())
    };

    var identity = new ClaimsIdentity(claims, "cookie");
    var principal = new ClaimsPrincipal(identity);
    
    var properties = new AuthenticationProperties
    {
        IsPersistent = true,
        ExpiresUtc = DateTimeOffset.MaxValue
    };

    await context.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, principal, properties);
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

app.Run();
