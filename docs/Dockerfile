FROM jekyll/jekyll:4.0

WORKDIR /usr/src/docs

COPY . .

RUN chown -R jekyll:jekyll /usr/src/docs
RUN chmod -R 755 /usr/src/docs

RUN bundle install

CMD ["bundle", "exec", "jekyll", "serve", "--force_polling", "-H", "0.0.0.0", "-P", "4000"]
